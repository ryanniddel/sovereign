import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../database/prisma.service';

// Map common notification titles to categories
const CATEGORY_MAP: Record<string, string> = {
  'escalation': 'ESCALATION',
  'meeting': 'MEETING',
  'commitment': 'COMMITMENT',
  'action item': 'ACTION_ITEM',
  'briefing': 'BRIEFING',
  'closeout': 'CLOSEOUT',
  'focus': 'FOCUS_MODE',
  'overdue': 'ESCALATION',
  'morning briefing': 'BRIEFING',
  'nightly review': 'BRIEFING',
};

function inferCategory(title: string, message: string): string {
  const combined = `${title} ${message}`.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (combined.includes(keyword)) return category;
  }
  return 'SYSTEM';
}

@Processor('notification')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'send-notification') return;

    const {
      userId,
      channel = 'IN_APP',
      priority = 'MEDIUM',
      title,
      message,
      category,
      targetType,
      targetId,
      groupKey,
    } = job.data;

    if (!userId || !title || !message) {
      this.logger.warn(`Invalid notification job data: missing required fields`);
      return;
    }

    const resolvedCategory = category || inferCategory(title, message);

    try {
      const notification = await this.notificationsService.createNotification({
        userId,
        title,
        message,
        category: resolvedCategory,
        channel,
        priority,
        targetType,
        targetId,
        groupKey,
      });

      if (notification.suppressed) {
        this.logger.log(
          `Notification suppressed for user ${userId}: "${title}" (${notification.suppressionReason})`,
        );
        return;
      }

      // Dispatch to channel
      const dispatched = await this.dispatchToChannel(channel, notification);

      if (dispatched) {
        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { deliveredAt: new Date() },
        });
      }

      this.logger.log(
        `Delivered ${channel} notification to user ${userId}: "${title}" [${resolvedCategory}/${priority}]`,
      );
    } catch (error) {
      this.logger.error(`Failed to create notification for user ${userId}: ${error}`);
    }
  }

  // ── Channel Dispatch Stubs ──

  private async dispatchToChannel(
    channel: string,
    notification: { id: string; userId: string; title: string; message: string },
  ): Promise<boolean> {
    switch (channel) {
      case 'IN_APP':
        // IN_APP is delivered by virtue of existing in the DB
        return true;

      case 'EMAIL':
        return this.dispatchEmail(notification);

      case 'SMS':
        return this.dispatchSms(notification);

      case 'SLACK':
        return this.dispatchSlack(notification);

      case 'PHONE_CALL':
        return this.dispatchPhoneCall(notification);

      default:
        this.logger.warn(`Unknown channel: ${channel}, treating as IN_APP`);
        return true;
    }
  }

  private async dispatchEmail(notification: { title: string; message: string }): Promise<boolean> {
    // TODO: Integrate email provider (SendGrid, SES, etc.)
    this.logger.log(`[EMAIL STUB] Would send email: "${notification.title}"`);
    return true;
  }

  private async dispatchSms(notification: { title: string; message: string }): Promise<boolean> {
    // TODO: Integrate SMS provider (Twilio, etc.)
    this.logger.log(`[SMS STUB] Would send SMS: "${notification.title}"`);
    return true;
  }

  private async dispatchSlack(notification: { title: string; message: string }): Promise<boolean> {
    // TODO: Integrate Slack API
    this.logger.log(`[SLACK STUB] Would send Slack message: "${notification.title}"`);
    return true;
  }

  private async dispatchPhoneCall(notification: { title: string; message: string }): Promise<boolean> {
    // TODO: Integrate voice provider (Twilio, etc.)
    this.logger.log(`[PHONE STUB] Would initiate call: "${notification.title}"`);
    return true;
  }
}
