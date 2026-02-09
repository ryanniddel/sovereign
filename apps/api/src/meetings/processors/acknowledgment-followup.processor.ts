import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QUEUE_NAMES } from '../../queue/queue.module';

@Processor('meetings')
export class AcknowledgmentFollowupProcessor extends WorkerHost {
  private readonly logger = new Logger(AcknowledgmentFollowupProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.ESCALATION) private readonly escalationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'acknowledgment-followup') {
      await this.handleAcknowledgmentFollowup(job);
    } else if (job.name === 'distribute-meeting-prep') {
      await this.handleDistributeMeetingPrep(job);
    }
  }

  private async handleAcknowledgmentFollowup(job: Job) {
    const { meetingId, participantId, participantEmail, userId, followupType } = job.data;

    this.logger.log(
      `Processing ${followupType} acknowledgment followup for participant ${participantEmail} on meeting ${meetingId}`,
    );

    // Verify participant still hasn't acknowledged
    const participant = await this.prisma.meetingParticipant.findFirst({
      where: { id: participantId, meetingId },
    });

    if (!participant || participant.hasAcknowledged) {
      this.logger.log(`Participant ${participantEmail} already acknowledged, skipping`);
      return;
    }

    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, userId },
    });

    if (!meeting || ['COMPLETED', 'CANCELLED', 'AUTO_CANCELLED'].includes(meeting.status)) {
      this.logger.log(`Meeting ${meetingId} is ${meeting?.status ?? 'not found'}, skipping followup`);
      return;
    }

    if (followupType === 'REMINDER') {
      // 24h reminder — professional tone
      await this.notificationQueue.add('send-notification', {
        userId,
        channel: 'IN_APP',
        priority: 'MEDIUM',
        title: `Acknowledgment pending: ${meeting.title}`,
        message: `${participantEmail} has not yet acknowledged the meeting invitation for "${meeting.title}". Consider sending a reminder.`,
      });
    } else if (followupType === 'FINAL_WARNING') {
      // 48h final warning — escalate
      await this.notificationQueue.add('send-notification', {
        userId,
        channel: 'IN_APP',
        priority: 'HIGH',
        title: `Final warning: ${participantEmail} unacknowledged`,
        message: `${participantEmail} still has not acknowledged "${meeting.title}" after 48 hours. Escalation rules may apply.`,
      });

      // Trigger escalation if rules exist for NO_ACKNOWLEDGMENT
      const rules = await this.prisma.escalationRule.findMany({
        where: { userId, triggerType: 'NO_ACKNOWLEDGMENT', isActive: true },
      });

      for (const rule of rules) {
        await this.escalationQueue.add('execute-escalation', {
          ruleId: rule.id,
          targetType: 'ACKNOWLEDGMENT',
          targetId: meetingId,
          userId,
          stepOrder: 0,
          retryCount: 0,
        });
      }
    }
  }

  private async handleDistributeMeetingPrep(job: Job) {
    const { meetingId, userId } = job.data;

    this.logger.log(`Distributing meeting prep for meeting ${meetingId}`);

    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, userId },
      include: { participants: true },
    });

    if (!meeting) {
      this.logger.warn(`Meeting ${meetingId} not found, skipping prep distribution`);
      return;
    }

    if (!meeting.preReadUrl) {
      this.logger.log(`Meeting ${meetingId} has no pre-read URL, skipping distribution`);
      return;
    }

    if (meeting.preReadDistributedAt) {
      this.logger.log(`Meeting ${meetingId} pre-read already distributed, skipping`);
      return;
    }

    // Notify all participants about pre-read
    for (const participant of meeting.participants) {
      await this.notificationQueue.add('send-notification', {
        userId,
        channel: 'EMAIL',
        priority: 'HIGH',
        title: `Pre-read available: ${meeting.title}`,
        message: `Pre-read materials are now available for "${meeting.title}". Please review before the meeting: ${meeting.preReadUrl}`,
      });
    }

    // Mark as distributed and set deadline (24h before meeting)
    const deadline = meeting.scheduledStartTime
      ? new Date(meeting.scheduledStartTime.getTime() - 24 * 60 * 60 * 1000)
      : null;

    await this.prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        preReadDistributedAt: new Date(),
        preReadDeadline: deadline,
        status: meeting.status === 'SCHEDULED' ? 'PREP_SENT' : meeting.status,
      },
    });

    this.logger.log(
      `Pre-read distributed to ${meeting.participants.length} participants for meeting ${meetingId}`,
    );
  }
}
