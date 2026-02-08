import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QUEUE_NAMES } from '../../queue/queue.module';

@Processor('ai-processing')
export class MeetingAutoCancelProcessor extends WorkerHost {
  private readonly logger = new Logger(MeetingAutoCancelProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'meeting-auto-cancel-check') return;

    this.logger.log('Checking for meetings to auto-cancel (missing pre-reads)');

    const now = new Date();
    const meetings = await this.prisma.meeting.findMany({
      where: {
        status: 'SCHEDULED',
        preReadUrl: null,
        preReadDeadline: { lt: now },
      },
    });

    for (const meeting of meetings) {
      // Clean up linked calendar event
      const calendarEvent = await this.prisma.calendarEvent.findFirst({
        where: { meetingId: meeting.id },
      });
      if (calendarEvent) {
        if (calendarEvent.travelEventId) {
          await this.prisma.calendarEvent.delete({ where: { id: calendarEvent.travelEventId } }).catch(() => {});
        }
        await this.prisma.calendarEvent.delete({ where: { id: calendarEvent.id } }).catch(() => {});
      }

      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: 'AUTO_CANCELLED' },
      });

      await this.notificationQueue.add('send-notification', {
        userId: meeting.userId,
        channel: 'IN_APP',
        priority: 'HIGH',
        title: `Meeting auto-cancelled: ${meeting.title}`,
        message: 'Meeting was auto-cancelled because pre-read was not distributed before the deadline.',
      });

      this.logger.log(`Auto-cancelled meeting ${meeting.id} - missing pre-read`);
    }
  }
}
