import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from '../integrations.service';
import { IntegrationProvider } from '@prisma/client';

@Injectable()
export class SlackClient {
  private readonly logger = new Logger(SlackClient.name);

  constructor(private readonly integrationsService: IntegrationsService) {}

  // ── Private Helpers ──

  private async getWebClient(userId: string) {
    const tokens = await this.integrationsService.getDecryptedTokens(
      userId,
      'SLACK' as IntegrationProvider,
    );
    if (!tokens) {
      this.logger.warn(
        `Slack not connected for user ${userId} — skipping`,
      );
      return null;
    }

    const { WebClient } = await import('@slack/web-api');
    return new WebClient(tokens.accessToken);
  }

  // ── Channels ──

  async listChannels(
    userId: string,
  ): Promise<{ id: string; name: string }[]> {
    const client = await this.getWebClient(userId);
    if (!client) return [];

    try {
      const result = await client.conversations.list({
        types: 'public_channel,private_channel',
        limit: 200,
        exclude_archived: true,
      });

      return (
        result.channels?.map((c) => ({
          id: c.id!,
          name: c.name || c.id!,
        })) ?? []
      );
    } catch (err) {
      this.logger.error(`Slack listChannels failed for user ${userId}: ${err}`);
      return [];
    }
  }

  // ── Send Message to Channel ──

  async sendMessage(
    userId: string,
    channel: string,
    text: string,
    blocks?: any[],
  ): Promise<boolean> {
    const client = await this.getWebClient(userId);
    if (!client) return false;

    try {
      const payload: Record<string, unknown> = { channel, text };
      if (blocks && blocks.length > 0) {
        payload.blocks = blocks;
      }

      await client.chat.postMessage(payload as any);
      this.logger.log(
        `Slack message sent to channel ${channel} for user ${userId}`,
      );
      return true;
    } catch (err) {
      this.logger.error(
        `Slack sendMessage failed for user ${userId}, channel ${channel}: ${err}`,
      );
      return false;
    }
  }

  // ── Send Direct Message ──

  async sendDM(
    userId: string,
    slackUserId: string,
    text: string,
  ): Promise<boolean> {
    const client = await this.getWebClient(userId);
    if (!client) return false;

    try {
      // Open a DM conversation with the target Slack user
      const openResult = await client.conversations.open({
        users: slackUserId,
      });

      const dmChannelId = openResult.channel?.id;
      if (!dmChannelId) {
        this.logger.error(
          `Slack sendDM: could not open DM channel with ${slackUserId}`,
        );
        return false;
      }

      await client.chat.postMessage({
        channel: dmChannelId,
        text,
      });

      this.logger.log(
        `Slack DM sent to ${slackUserId} for user ${userId}`,
      );
      return true;
    } catch (err) {
      this.logger.error(
        `Slack sendDM failed for user ${userId}, target ${slackUserId}: ${err}`,
      );
      return false;
    }
  }
}
