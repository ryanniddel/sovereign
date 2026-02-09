import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from '../integrations.service';
import { IntegrationProvider } from '@prisma/client';

@Injectable()
export class ZoomClient {
  private readonly logger = new Logger(ZoomClient.name);
  private readonly baseUrl = 'https://api.zoom.us/v2';

  constructor(private readonly integrationsService: IntegrationsService) {}

  // ── Private Helpers ──

  private async getHeaders(
    userId: string,
  ): Promise<Record<string, string> | null> {
    const tokens = await this.integrationsService.getDecryptedTokens(
      userId,
      'ZOOM',
    );
    if (!tokens) return null;
    return {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // ── Create Meeting ──

  async createMeeting(
    userId: string,
    topic: string,
    startTime: Date,
    durationMinutes: number,
  ): Promise<{ joinUrl: string; meetingId: string } | null> {
    const headers = await this.getHeaders(userId);
    if (!headers) {
      this.logger.warn(`No Zoom tokens for user ${userId}`);
      return null;
    }

    try {
      const res = await fetch(`${this.baseUrl}/users/me/meetings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic,
          type: 2, // Scheduled meeting
          start_time: startTime.toISOString(),
          duration: durationMinutes,
          settings: {
            join_before_host: true,
            waiting_room: false,
          },
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'ZOOM' as IntegrationProvider);
        const errorBody = await res.text();
        this.logger.error(
          `Zoom createMeeting failed (${res.status}): ${errorBody}`,
        );
        return null;
      }

      const data = await res.json();
      this.logger.log(
        `Zoom meeting created: ${data.id} for user ${userId}`,
      );

      return {
        joinUrl: data.join_url,
        meetingId: String(data.id),
      };
    } catch (err) {
      this.logger.error(`Zoom createMeeting error: ${err}`);
      return null;
    }
  }

  // ── Get Meeting Details ──

  async getMeeting(
    userId: string,
    meetingId: string,
  ): Promise<any | null> {
    const headers = await this.getHeaders(userId);
    if (!headers) return null;

    try {
      const res = await fetch(`${this.baseUrl}/meetings/${meetingId}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'ZOOM' as IntegrationProvider);
        const errorBody = await res.text();
        this.logger.error(
          `Zoom getMeeting failed (${res.status}): ${errorBody}`,
        );
        return null;
      }

      return await res.json();
    } catch (err) {
      this.logger.error(`Zoom getMeeting error: ${err}`);
      return null;
    }
  }

  // ── Get Recordings ──

  async getRecordings(
    userId: string,
    meetingId: string,
  ): Promise<{ recordingUrl: string } | null> {
    const headers = await this.getHeaders(userId);
    if (!headers) return null;

    try {
      const res = await fetch(
        `${this.baseUrl}/meetings/${meetingId}/recordings`,
        {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'ZOOM' as IntegrationProvider);
        // 404 means no recordings yet — not an error
        if (res.status === 404) {
          this.logger.debug(
            `No recordings found for Zoom meeting ${meetingId}`,
          );
          return null;
        }
        const errorBody = await res.text();
        this.logger.error(
          `Zoom getRecordings failed (${res.status}): ${errorBody}`,
        );
        return null;
      }

      const data = await res.json();

      // Find the shared screen or speaker recording URL
      const shareUrl = data.share_url;
      if (shareUrl) {
        return { recordingUrl: shareUrl };
      }

      // Fallback: find the first recording file with a play_url
      const files = data.recording_files || [];
      const playable = files.find(
        (f: any) => f.play_url || f.download_url,
      );
      if (playable) {
        return { recordingUrl: playable.play_url || playable.download_url };
      }

      this.logger.debug(
        `Zoom meeting ${meetingId} has recordings but no playable URL`,
      );
      return null;
    } catch (err) {
      this.logger.error(`Zoom getRecordings error: ${err}`);
      return null;
    }
  }
}
