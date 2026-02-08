import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';

@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'send-notification') return;

    const { userId, channel, priority, title, message } = job.data;

    const shouldDeliver = await this.notificationsService.shouldDeliver(
      userId,
      channel,
      priority,
    );

    if (!shouldDeliver) {
      this.logger.log(`Notification suppressed for user ${userId} (focus mode / preferences)`);
      return;
    }

    this.logger.log(`Delivering ${channel} notification to user ${userId}: ${title}`);
  }
}
