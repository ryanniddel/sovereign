import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from '../integrations.service';
import { IntegrationProvider } from '@prisma/client';

const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';
const GMAIL_BASE = 'https://www.googleapis.com/gmail/v1';

export type GoogleCalendarListItem = {
  id: string;
  summary: string;
  primary?: boolean;
  accessRole?: string;
};

export type GoogleEvent = {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  status?: string;
  htmlLink?: string;
  created?: string;
  updated?: string;
  organizer?: { email?: string; displayName?: string };
  attendees?: Array<{ email: string; responseStatus?: string }>;
  recurrence?: string[];
};

export type CreateEventPayload = {
  summary: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
};

@Injectable()
export class GoogleApisClient {
  private readonly logger = new Logger(GoogleApisClient.name);

  constructor(private readonly integrationsService: IntegrationsService) {}

  // ── Calendar ──────────────────────────────────────────

  /**
   * List all calendars for the user.
   * GET /calendar/v3/users/me/calendarList
   */
  async listCalendars(
    userId: string,
  ): Promise<GoogleCalendarListItem[]> {
    const tokens = await this.getTokens(userId);
    if (!tokens) return [];

    try {
      const res = await fetch(
        `${CALENDAR_BASE}/users/me/calendarList`,
        {
          headers: this.authHeaders(tokens.accessToken),
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'GOOGLE' as IntegrationProvider);
        this.logger.error(
          `listCalendars failed: ${res.status} ${res.statusText}`,
        );
        return [];
      }

      const data = await res.json();
      return (data.items || []) as GoogleCalendarListItem[];
    } catch (err) {
      this.logger.error(`listCalendars error: ${err}`);
      return [];
    }
  }

  /**
   * List events from a specific calendar.
   * GET /calendar/v3/calendars/{calendarId}/events
   */
  async listEvents(
    userId: string,
    calendarId: string,
    since?: Date,
  ): Promise<GoogleEvent[]> {
    const tokens = await this.getTokens(userId);
    if (!tokens) return [];

    try {
      const params = new URLSearchParams({
        maxResults: '250',
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      if (since) {
        params.set('timeMin', since.toISOString());
      }

      const encodedCalendarId = encodeURIComponent(calendarId);
      const res = await fetch(
        `${CALENDAR_BASE}/calendars/${encodedCalendarId}/events?${params.toString()}`,
        {
          headers: this.authHeaders(tokens.accessToken),
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'GOOGLE' as IntegrationProvider);
        this.logger.error(
          `listEvents failed: ${res.status} ${res.statusText}`,
        );
        return [];
      }

      const data = await res.json();
      return (data.items || []) as GoogleEvent[];
    } catch (err) {
      this.logger.error(`listEvents error: ${err}`);
      return [];
    }
  }

  /**
   * Create a new event in a calendar.
   * POST /calendar/v3/calendars/{calendarId}/events
   */
  async createEvent(
    userId: string,
    calendarId: string,
    event: CreateEventPayload,
  ): Promise<GoogleEvent | null> {
    const tokens = await this.getTokens(userId);
    if (!tokens) return null;

    try {
      const body = {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: { dateTime: event.start.toISOString() },
        end: { dateTime: event.end.toISOString() },
      };

      const encodedCalendarId = encodeURIComponent(calendarId);
      const res = await fetch(
        `${CALENDAR_BASE}/calendars/${encodedCalendarId}/events`,
        {
          method: 'POST',
          headers: {
            ...this.authHeaders(tokens.accessToken),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'GOOGLE' as IntegrationProvider);
        this.logger.error(
          `createEvent failed: ${res.status} ${res.statusText}`,
        );
        return null;
      }

      return (await res.json()) as GoogleEvent;
    } catch (err) {
      this.logger.error(`createEvent error: ${err}`);
      return null;
    }
  }

  /**
   * Update an existing event.
   * PATCH /calendar/v3/calendars/{calendarId}/events/{eventId}
   */
  async updateEvent(
    userId: string,
    calendarId: string,
    eventId: string,
    updates: Partial<CreateEventPayload>,
  ): Promise<GoogleEvent | null> {
    const tokens = await this.getTokens(userId);
    if (!tokens) return null;

    try {
      const body: Record<string, unknown> = {};
      if (updates.summary !== undefined) body.summary = updates.summary;
      if (updates.description !== undefined)
        body.description = updates.description;
      if (updates.location !== undefined) body.location = updates.location;
      if (updates.start) body.start = { dateTime: updates.start.toISOString() };
      if (updates.end) body.end = { dateTime: updates.end.toISOString() };

      const encodedCalendarId = encodeURIComponent(calendarId);
      const encodedEventId = encodeURIComponent(eventId);
      const res = await fetch(
        `${CALENDAR_BASE}/calendars/${encodedCalendarId}/events/${encodedEventId}`,
        {
          method: 'PATCH',
          headers: {
            ...this.authHeaders(tokens.accessToken),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'GOOGLE' as IntegrationProvider);
        this.logger.error(
          `updateEvent failed: ${res.status} ${res.statusText}`,
        );
        return null;
      }

      return (await res.json()) as GoogleEvent;
    } catch (err) {
      this.logger.error(`updateEvent error: ${err}`);
      return null;
    }
  }

  /**
   * Delete an event from a calendar.
   * DELETE /calendar/v3/calendars/{calendarId}/events/{eventId}
   */
  async deleteEvent(
    userId: string,
    calendarId: string,
    eventId: string,
  ): Promise<boolean> {
    const tokens = await this.getTokens(userId);
    if (!tokens) return false;

    try {
      const encodedCalendarId = encodeURIComponent(calendarId);
      const encodedEventId = encodeURIComponent(eventId);
      const res = await fetch(
        `${CALENDAR_BASE}/calendars/${encodedCalendarId}/events/${encodedEventId}`,
        {
          method: 'DELETE',
          headers: this.authHeaders(tokens.accessToken),
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'GOOGLE' as IntegrationProvider);
        this.logger.error(
          `deleteEvent failed: ${res.status} ${res.statusText}`,
        );
        return false;
      }

      return true;
    } catch (err) {
      this.logger.error(`deleteEvent error: ${err}`);
      return false;
    }
  }

  // ── Gmail ─────────────────────────────────────────────

  /**
   * Send an email via Gmail API using RFC 2822 format.
   * POST /gmail/v1/users/me/messages/send
   */
  async sendEmail(
    userId: string,
    to: string,
    subject: string,
    htmlBody: string,
  ): Promise<boolean> {
    const tokens = await this.getTokens(userId);
    if (!tokens) return false;

    try {
      const rawMessage = this.buildRfc2822Message(to, subject, htmlBody);
      const encodedMessage = this.base64UrlEncode(rawMessage);

      const res = await fetch(`${GMAIL_BASE}/users/me/messages/send`, {
        method: 'POST',
        headers: {
          ...this.authHeaders(tokens.accessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedMessage }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'GOOGLE' as IntegrationProvider);
        this.logger.error(
          `sendEmail failed: ${res.status} ${res.statusText}`,
        );
        return false;
      }

      this.logger.log(`Email sent to ${to} via Gmail API`);
      return true;
    } catch (err) {
      this.logger.error(`sendEmail error: ${err}`);
      return false;
    }
  }

  // ── Private Helpers ───────────────────────────────────

  private async getTokens(userId: string) {
    const tokens = await this.integrationsService.getDecryptedTokens(
      userId,
      'GOOGLE' as IntegrationProvider,
    );
    if (!tokens) {
      this.logger.warn(
        `No active Google connection for user ${userId}`,
      );
      return null;
    }
    return tokens;
  }

  private authHeaders(accessToken: string): Record<string, string> {
    return { Authorization: `Bearer ${accessToken}` };
  }

  private buildRfc2822Message(
    to: string,
    subject: string,
    htmlBody: string,
  ): string {
    return (
      `To: ${to}\r\n` +
      `Subject: ${subject}\r\n` +
      `Content-Type: text/html; charset=utf-8\r\n` +
      `\r\n` +
      htmlBody
    );
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str, 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}
