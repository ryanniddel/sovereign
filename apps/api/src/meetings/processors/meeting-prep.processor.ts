import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QUEUE_NAMES } from '../../queue/queue.module';

@Processor('meetings')
export class MeetingPrepProcessor extends WorkerHost {
  private readonly logger = new Logger(MeetingPrepProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'meeting-prep-reminder') return;

    const { meetingId, userId } = job.data;
    this.logger.log(`Processing meeting prep reminder for meeting ${meetingId}`);

    const meeting = await this.prisma.meeting.findFirst({
      where: { id: meetingId, userId },
      include: { participants: true },
    });

    if (!meeting) {
      this.logger.warn(`Meeting ${meetingId} not found, skipping prep reminder`);
      return;
    }

    if (['COMPLETED', 'CANCELLED', 'AUTO_CANCELLED'].includes(meeting.status)) {
      this.logger.log(`Meeting ${meetingId} is ${meeting.status}, skipping prep reminder`);
      return;
    }

    const issues: string[] = [];

    if (!meeting.agendaUrl) {
      issues.push('No agenda submitted');
    }
    if (!meeting.preReadUrl) {
      issues.push('No pre-read distributed');
    }

    const unacknowledged = meeting.participants.filter((p) => !p.hasAcknowledged);
    if (unacknowledged.length > 0) {
      issues.push(`${unacknowledged.length} participant(s) have not acknowledged`);
    }

    if (issues.length > 0) {
      this.logger.log(`Meeting ${meetingId} prep issues: ${issues.join(', ')}`);

      await this.notificationQueue.add('send-notification', {
        userId,
        channel: 'IN_APP',
        priority: 'HIGH',
        title: `Meeting prep needed: ${meeting.title}`,
        message: `Issues: ${issues.join('; ')}`,
      });
    } else {
      this.logger.log(`Meeting ${meetingId} prep is complete`);
    }
  }
}
