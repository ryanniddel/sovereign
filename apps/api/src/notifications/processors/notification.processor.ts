import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';

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

  constructor(private readonly notificationsService: NotificationsService) {
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
      } else {
        this.logger.log(
          `Delivered ${channel} notification to user ${userId}: "${title}" [${resolvedCategory}/${priority}]`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to create notification for user ${userId}: ${error}`);
    }
  }
}
