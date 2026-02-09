import { Injectable, Logger } from '@nestjs/common';
import { IntegrationsService } from '../integrations.service';
import { IntegrationProvider } from '@prisma/client';

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0';

interface GraphCalendar {
  id: string;
  name: string;
  isDefaultCalendar?: boolean;
}

interface GraphEvent {
  id: string;
  subject: string;
  bodyPreview?: string;
  body?: { contentType: string; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName?: string };
  isAllDay?: boolean;
  isCancelled?: boolean;
  recurrence?: unknown;
  isOnlineMeeting?: boolean;
  onlineMeeting?: { joinUrl?: string };
  lastModifiedDateTime?: string;
  createdDateTime?: string;
}

interface CreateEventPayload {
  subject: string;
  start: Date;
  end: Date;
  location?: string;
  body?: string;
  isOnline?: boolean;
}

@Injectable()
export class MicrosoftGraphClient {
  private readonly logger = new Logger(MicrosoftGraphClient.name);

  constructor(private readonly integrationsService: IntegrationsService) {}

  // ── Auth Headers ──

  private async getHeaders(
    userId: string,
  ): Promise<Record<string, string> | null> {
    const tokens = await this.integrationsService.getDecryptedTokens(
      userId,
      'MICROSOFT' as IntegrationProvider,
    );
    if (!tokens) return null;
    return {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // ── Calendars ──

  async listCalendars(
    userId: string,
  ): Promise<{ id: string; name: string; isDefault: boolean }[]> {
    const headers = await this.getHeaders(userId);
    if (!headers) return [];

    try {
      const res = await fetch(`${GRAPH_BASE}/me/calendars`, { headers, signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'MICROSOFT' as IntegrationProvider);
        this.logger.error(
          `listCalendars failed: ${res.status} ${res.statusText}`,
        );
        return [];
      }
      const data = await res.json();
      return (data.value || []).map((cal: GraphCalendar) => ({
        id: cal.id,
        name: cal.name,
        isDefault: cal.isDefaultCalendar ?? false,
      }));
    } catch (err) {
      this.logger.error(`listCalendars error: ${err}`);
      return [];
    }
  }

  // ── Events ──

  async listEvents(
    userId: string,
    calendarId: string,
    since?: Date,
  ): Promise<GraphEvent[]> {
    const headers = await this.getHeaders(userId);
    if (!headers) return [];

    try {
      let url = `${GRAPH_BASE}/me/calendars/${encodeURIComponent(calendarId)}/events?$top=250&$orderby=lastModifiedDateTime desc`;

      if (since) {
        const sinceISO = since.toISOString();
        url += `&$filter=lastModifiedDateTime ge ${sinceISO}`;
      }

      const res = await fetch(url, { headers, signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'MICROSOFT' as IntegrationProvider);
        this.logger.error(
          `listEvents failed: ${res.status} ${res.statusText}`,
        );
        return [];
      }
      const data = await res.json();
      return data.value || [];
    } catch (err) {
      this.logger.error(`listEvents error: ${err}`);
      return [];
    }
  }

  async createEvent(
    userId: string,
    calendarId: string,
    event: CreateEventPayload,
  ): Promise<GraphEvent | null> {
    const headers = await this.getHeaders(userId);
    if (!headers) return null;

    try {
      const body: Record<string, unknown> = {
        subject: event.subject,
        start: {
          dateTime: event.start.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: event.end.toISOString(),
          timeZone: 'UTC',
        },
      };

      if (event.location) {
        body.location = { displayName: event.location };
      }

      if (event.body) {
        body.body = { contentType: 'text', content: event.body };
      }

      if (event.isOnline) {
        body.isOnlineMeeting = true;
        body.onlineMeetingProvider = 'teamsForBusiness';
      }

      const res = await fetch(
        `${GRAPH_BASE}/me/calendars/${encodeURIComponent(calendarId)}/events`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'MICROSOFT' as IntegrationProvider);
        this.logger.error(
          `createEvent failed: ${res.status} ${res.statusText}`,
        );
        return null;
      }

      return await res.json();
    } catch (err) {
      this.logger.error(`createEvent error: ${err}`);
      return null;
    }
  }

  async updateEvent(
    userId: string,
    calendarId: string,
    eventId: string,
    updates: Partial<CreateEventPayload>,
  ): Promise<GraphEvent | null> {
    const headers = await this.getHeaders(userId);
    if (!headers) return null;

    try {
      const body: Record<string, unknown> = {};

      if (updates.subject !== undefined) {
        body.subject = updates.subject;
      }
      if (updates.start !== undefined) {
        body.start = {
          dateTime: updates.start.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (updates.end !== undefined) {
        body.end = {
          dateTime: updates.end.toISOString(),
          timeZone: 'UTC',
        };
      }
      if (updates.location !== undefined) {
        body.location = { displayName: updates.location };
      }
      if (updates.body !== undefined) {
        body.body = { contentType: 'text', content: updates.body };
      }
      if (updates.isOnline !== undefined) {
        body.isOnlineMeeting = updates.isOnline;
      }

      const res = await fetch(
        `${GRAPH_BASE}/me/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'MICROSOFT' as IntegrationProvider);
        this.logger.error(
          `updateEvent failed: ${res.status} ${res.statusText}`,
        );
        return null;
      }

      return await res.json();
    } catch (err) {
      this.logger.error(`updateEvent error: ${err}`);
      return null;
    }
  }

  async deleteEvent(
    userId: string,
    calendarId: string,
    eventId: string,
  ): Promise<boolean> {
    const headers = await this.getHeaders(userId);
    if (!headers) return false;

    try {
      const res = await fetch(
        `${GRAPH_BASE}/me/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
        {
          method: 'DELETE',
          headers,
          signal: AbortSignal.timeout(15_000),
        },
      );

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'MICROSOFT' as IntegrationProvider);
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

  // ── Online Meetings (Teams) ──

  async createOnlineMeeting(
    userId: string,
    subject: string,
    start: Date,
    end: Date,
  ): Promise<{ joinUrl: string; meetingId: string } | null> {
    const headers = await this.getHeaders(userId);
    if (!headers) return null;

    try {
      const body = {
        subject,
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
      };

      const res = await fetch(`${GRAPH_BASE}/me/onlineMeetings`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });

      if (!res.ok) {
        if (res.status === 401) await this.integrationsService.markConnectionExpired(userId, 'MICROSOFT' as IntegrationProvider);
        this.logger.error(
          `createOnlineMeeting failed: ${res.status} ${res.statusText}`,
        );
        return null;
      }

      const data = await res.json();
      return {
        joinUrl: data.joinWebUrl || data.joinUrl,
        meetingId: data.id,
      };
    } catch (err) {
      this.logger.error(`createOnlineMeeting error: ${err}`);
      return null;
    }
  }
}
