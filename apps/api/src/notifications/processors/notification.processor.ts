import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { PrismaService } from '../../database/prisma.service';
import { SlackClient } from '../../integrations/providers/slack.client';
import { TwilioClient } from '../../integrations/providers/twilio.client';
import { GoogleApisClient } from '../../integrations/providers/google-apis.client';
import { IntegrationsService } from '../../integrations/integrations.service';

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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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
    private readonly slackClient: SlackClient,
    private readonly twilioClient: TwilioClient,
    private readonly googleApisClient: GoogleApisClient,
    private readonly integrationsService: IntegrationsService,
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

  // ── Channel Dispatch ──

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

  private async dispatchEmail(
    notification: { userId: string; title: string; message: string },
  ): Promise<boolean> {
    // Check if user has Google connected for Gmail sending
    const tokens = await this.integrationsService.getDecryptedTokens(
      notification.userId,
      'GOOGLE',
    );

    if (!tokens) {
      this.logger.warn(
        `Email dispatch skipped for user ${notification.userId}: no active Google connection for Gmail`,
      );
      return false;
    }

    // Look up the user's email address
    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true },
    });

    if (!user?.email) {
      this.logger.warn(
        `Email dispatch skipped for user ${notification.userId}: no email address on file`,
      );
      return false;
    }

    const htmlBody = `<h2>${escapeHtml(notification.title)}</h2><p>${escapeHtml(notification.message)}</p>`;
    return this.googleApisClient.sendEmail(
      notification.userId,
      user.email,
      notification.title,
      htmlBody,
    );
  }

  private async dispatchSms(
    notification: { userId: string; title: string; message: string },
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
      select: { phoneNumber: true, phoneVerified: true },
    });

    if (!user?.phoneNumber || !user.phoneVerified) {
      this.logger.warn(
        `SMS dispatch skipped for user ${notification.userId}: no verified phone number`,
      );
      return false;
    }

    const body = `${notification.title}\n${notification.message}`;
    const result = await this.twilioClient.sendSms(user.phoneNumber, body);
    return result !== null;
  }

  private async dispatchSlack(
    notification: { userId: string; title: string; message: string },
  ): Promise<boolean> {
    const text = `*${notification.title}*\n${notification.message}`;
    // Attempt to send via the user's connected Slack.
    // Use sendMessage to a default notification channel, or sendDM to self.
    // We use sendDM to the user's own Slack identity for personal notifications.
    const conn = await this.prisma.oAuthConnection.findUnique({
      where: {
        userId_provider: {
          userId: notification.userId,
          provider: 'SLACK',
        },
      },
      select: { externalAccountId: true, status: true },
    });

    if (!conn || conn.status !== 'ACTIVE' || !conn.externalAccountId) {
      this.logger.warn(
        `Slack dispatch skipped for user ${notification.userId}: no active Slack connection`,
      );
      return false;
    }

    return this.slackClient.sendDM(
      notification.userId,
      conn.externalAccountId,
      text,
    );
  }

  private async dispatchPhoneCall(
    notification: { userId: string; title: string; message: string },
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
      select: { phoneNumber: true, phoneVerified: true },
    });

    if (!user?.phoneNumber || !user.phoneVerified) {
      this.logger.warn(
        `Phone call dispatch skipped for user ${notification.userId}: no verified phone number`,
      );
      return false;
    }

    const twiml = `<Response><Say>${escapeXml(notification.title)}. ${escapeXml(notification.message)}</Say></Response>`;
    const result = await this.twilioClient.makeCall(user.phoneNumber, twiml);
    return result !== null;
  }
}
