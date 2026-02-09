import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { MicrosoftGraphClient } from '../../integrations/providers/microsoft-graph.client';
import { GoogleApisClient, GoogleEvent } from '../../integrations/providers/google-apis.client';
import { IntegrationsService } from '../../integrations/integrations.service';
import { CalendarSource } from '@prisma/client';
import * as crypto from 'crypto';

@Processor('sync')
export class CalendarSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CalendarSyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly graphClient: MicrosoftGraphClient,
    private readonly googleClient: GoogleApisClient,
    private readonly integrationsService: IntegrationsService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'calendar-sync-execute') return;

    const { syncConfigId, userId } = job.data;
    this.logger.log(`Executing calendar sync for config ${syncConfigId}`);

    const config = await this.prisma.calendarSyncConfig.findFirst({
      where: { id: syncConfigId, userId, status: 'ACTIVE' },
    });

    if (!config) {
      this.logger.warn(`Sync config ${syncConfigId} not found or inactive, skipping`);
      return;
    }

    try {
      let syncedCount = 0;

      if (config.source === 'OUTLOOK' as CalendarSource) {
        syncedCount = await this.syncOutlookCalendar(userId, config);
      } else if (config.source === 'GOOGLE' as CalendarSource) {
        syncedCount = await this.syncGoogleCalendar(userId, config);
      } else {
        // SOVEREIGN source — no external sync needed
        syncedCount = await this.syncStub(userId, config);
      }

      // Update sync timestamps
      const now = new Date();
      const nextSync = new Date(now.getTime() + config.syncIntervalMinutes * 60 * 1000);

      await this.prisma.calendarSyncConfig.update({
        where: { id: config.id },
        data: {
          lastSyncAt: now,
          nextSyncAt: nextSync,
          lastSyncError: null,
          status: 'ACTIVE',
        },
      });

      this.logger.log(
        `Calendar sync complete for config ${syncConfigId}: ${syncedCount} events synced`,
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);

      // Calculate backoff: double the interval on failure, max 60 minutes
      const backoffMinutes = Math.min(config.syncIntervalMinutes * 2, 60);
      const nextRetry = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await this.prisma.calendarSyncConfig.update({
        where: { id: config.id },
        data: {
          lastSyncError: errorMsg,
          nextSyncAt: nextRetry,
          status: 'ERROR',
        },
      });

      this.logger.error(`Calendar sync failed for config ${syncConfigId}: ${errorMsg}`);
    }
  }

  // ── Outlook / Microsoft Graph Sync ──

  private async syncOutlookCalendar(
    userId: string,
    config: {
      id: string;
      externalCalendarId: string | null;
      lastSyncAt: Date | null;
      sovereignWins: boolean;
      autoImportNewEvents: boolean;
      importAsEventType: string | null;
      direction: string;
    },
  ): Promise<number> {
    if (!config.externalCalendarId) {
      this.logger.warn(`No external calendar ID set for sync config ${config.id}, skipping`);
      return 0;
    }

    // Verify Microsoft connection is active
    const tokens = await this.integrationsService.getDecryptedTokens(userId, 'MICROSOFT');
    if (!tokens) {
      this.logger.warn(`No active Microsoft connection for user ${userId}, skipping Outlook sync`);
      return 0;
    }

    // Fetch events modified since last sync (or all if first sync)
    const events = await this.graphClient.listEvents(
      userId,
      config.externalCalendarId,
      config.lastSyncAt ?? undefined,
    );

    if (!events.length) {
      this.logger.debug(`No new/modified events from Outlook for config ${config.id}`);
      return 0;
    }

    let syncedCount = 0;

    for (const event of events) {
      try {
        await this.upsertCalendarEventFromOutlook(userId, config, event);
        syncedCount++;
      } catch (err) {
        this.logger.error(
          `Failed to sync Outlook event ${event.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return syncedCount;
  }

  private async upsertCalendarEventFromOutlook(
    userId: string,
    config: {
      id: string;
      externalCalendarId: string | null;
      sovereignWins: boolean;
      autoImportNewEvents: boolean;
      importAsEventType: string | null;
      direction: string;
    },
    event: {
      id: string;
      subject: string;
      bodyPreview?: string;
      body?: { contentType: string; content: string };
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
      location?: { displayName?: string };
      isAllDay?: boolean;
      isCancelled?: boolean;
      isOnlineMeeting?: boolean;
      onlineMeeting?: { joinUrl?: string };
      lastModifiedDateTime?: string;
    },
  ): Promise<void> {
    // Compute a hash of the event data for change detection
    const eventHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        subject: event.subject,
        start: event.start,
        end: event.end,
        location: event.location?.displayName,
        isAllDay: event.isAllDay,
        isCancelled: event.isCancelled,
        lastModified: event.lastModifiedDateTime,
      }))
      .digest('hex');

    // Check if we already have this event
    const existing = await this.prisma.calendarEvent.findFirst({
      where: {
        userId,
        externalCalendarId: event.id,
        source: 'OUTLOOK',
      },
    });

    const startTime = new Date(event.start.dateTime + (event.start.timeZone === 'UTC' ? 'Z' : ''));
    const endTime = new Date(event.end.dateTime + (event.end.timeZone === 'UTC' ? 'Z' : ''));
    const eventType = (config.importAsEventType as any) || 'MEETING';

    if (existing) {
      // Skip if nothing changed
      if (existing.externalEventHash === eventHash) {
        return;
      }

      // Handle cancelled events
      if (event.isCancelled) {
        await this.prisma.calendarEvent.delete({ where: { id: existing.id } });

        await this.prisma.calendarSyncLog.create({
          data: {
            syncConfigId: config.id,
            direction: config.direction as any,
            externalEventId: event.id,
            calendarEventId: existing.id,
            action: 'DELETE',
            resolution: 'SOVEREIGN_WINS',
          },
        });
        return;
      }

      // Conflict detection: has the Sovereign event been modified since last sync?
      const hasConflict =
        existing.lastSyncedAt &&
        existing.updatedAt > existing.lastSyncedAt;

      let resolution: 'SOVEREIGN_WINS' | 'EXTERNAL_ACCEPTED' = config.sovereignWins
        ? 'SOVEREIGN_WINS'
        : 'EXTERNAL_ACCEPTED';

      if (hasConflict && config.sovereignWins) {
        // Sovereign wins — log conflict but don't overwrite
        await this.prisma.calendarSyncLog.create({
          data: {
            syncConfigId: config.id,
            direction: config.direction as any,
            externalEventId: event.id,
            calendarEventId: existing.id,
            action: 'CONFLICT',
            resolution: 'SOVEREIGN_WINS',
            hasConflict: true,
            sovereignData: {
              title: existing.title,
              startTime: existing.startTime.toISOString(),
              endTime: existing.endTime.toISOString(),
            },
            externalData: {
              subject: event.subject,
              start: event.start,
              end: event.end,
            },
          },
        });
        // Still update the hash so we don't re-process next time
        await this.prisma.calendarEvent.update({
          where: { id: existing.id },
          data: {
            externalEventHash: eventHash,
            lastSyncedAt: new Date(),
          },
        });
        return;
      }

      // External wins or no conflict — update the Sovereign event
      resolution = hasConflict ? 'EXTERNAL_ACCEPTED' : 'EXTERNAL_ACCEPTED';

      await this.prisma.calendarEvent.update({
        where: { id: existing.id },
        data: {
          title: event.subject,
          description: event.bodyPreview || undefined,
          startTime,
          endTime,
          isAllDay: event.isAllDay ?? false,
          location: event.location?.displayName || undefined,
          externalEventHash: eventHash,
          lastSyncedAt: new Date(),
        },
      });

      await this.prisma.calendarSyncLog.create({
        data: {
          syncConfigId: config.id,
          direction: config.direction as any,
          externalEventId: event.id,
          calendarEventId: existing.id,
          action: 'UPDATE',
          resolution,
          hasConflict: !!hasConflict,
          ...(hasConflict
            ? {
                sovereignData: {
                  title: existing.title,
                  startTime: existing.startTime.toISOString(),
                  endTime: existing.endTime.toISOString(),
                },
                externalData: {
                  subject: event.subject,
                  start: event.start,
                  end: event.end,
                },
                resolvedData: {
                  subject: event.subject,
                  start: event.start,
                  end: event.end,
                },
              }
            : {}),
        },
      });
    } else {
      // New event — create if autoImportNewEvents is enabled
      if (!config.autoImportNewEvents) {
        return;
      }

      // Skip cancelled events we never imported
      if (event.isCancelled) {
        return;
      }

      const created = await this.prisma.calendarEvent.create({
        data: {
          userId,
          title: event.subject,
          description: event.bodyPreview || undefined,
          startTime,
          endTime,
          isAllDay: event.isAllDay ?? false,
          location: event.location?.displayName || undefined,
          eventType,
          isProtected: false,
          source: 'OUTLOOK',
          externalCalendarId: event.id,
          externalEventHash: eventHash,
          lastSyncedAt: new Date(),
        },
      });

      await this.prisma.calendarSyncLog.create({
        data: {
          syncConfigId: config.id,
          direction: config.direction as any,
          externalEventId: event.id,
          calendarEventId: created.id,
          action: 'CREATE',
          resolution: 'EXTERNAL_ACCEPTED',
        },
      });
    }
  }

  // ── Google Calendar Sync ──

  private async syncGoogleCalendar(
    userId: string,
    config: {
      id: string;
      externalCalendarId: string | null;
      lastSyncAt: Date | null;
      sovereignWins: boolean;
      autoImportNewEvents: boolean;
      importAsEventType: string | null;
      direction: string;
    },
  ): Promise<number> {
    if (!config.externalCalendarId) {
      this.logger.warn(`No external calendar ID set for sync config ${config.id}, skipping`);
      return 0;
    }

    // Verify Google connection is active
    const tokens = await this.integrationsService.getDecryptedTokens(userId, 'GOOGLE');
    if (!tokens) {
      this.logger.warn(`No active Google connection for user ${userId}, skipping Google sync`);
      return 0;
    }

    // Fetch events modified since last sync (or all if first sync)
    const events = await this.googleClient.listEvents(
      userId,
      config.externalCalendarId,
      config.lastSyncAt ?? undefined,
    );

    if (!events.length) {
      this.logger.debug(`No new/modified events from Google for config ${config.id}`);
      return 0;
    }

    let syncedCount = 0;

    for (const event of events) {
      try {
        await this.upsertCalendarEventFromGoogle(userId, config, event);
        syncedCount++;
      } catch (err) {
        this.logger.error(
          `Failed to sync Google event ${event.id}: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    return syncedCount;
  }

  private async upsertCalendarEventFromGoogle(
    userId: string,
    config: {
      id: string;
      externalCalendarId: string | null;
      sovereignWins: boolean;
      autoImportNewEvents: boolean;
      importAsEventType: string | null;
      direction: string;
    },
    event: GoogleEvent,
  ): Promise<void> {
    // Compute a hash of the event data for change detection
    const eventHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        summary: event.summary,
        start: event.start,
        end: event.end,
        location: event.location,
        status: event.status,
        updated: event.updated,
      }))
      .digest('hex');

    // Check if we already have this event
    const existing = await this.prisma.calendarEvent.findFirst({
      where: {
        userId,
        externalCalendarId: event.id,
        source: 'GOOGLE',
      },
    });

    const startTime = event.start?.dateTime
      ? new Date(event.start.dateTime)
      : event.start?.date
        ? new Date(event.start.date)
        : new Date();
    const endTime = event.end?.dateTime
      ? new Date(event.end.dateTime)
      : event.end?.date
        ? new Date(event.end.date)
        : new Date();
    const isAllDay = !event.start?.dateTime && !!event.start?.date;
    const eventType = (config.importAsEventType as any) || 'MEETING';
    const isCancelled = event.status === 'cancelled';

    if (existing) {
      // Skip if nothing changed
      if (existing.externalEventHash === eventHash) {
        return;
      }

      // Handle cancelled events
      if (isCancelled) {
        await this.prisma.calendarEvent.delete({ where: { id: existing.id } });

        await this.prisma.calendarSyncLog.create({
          data: {
            syncConfigId: config.id,
            direction: config.direction as any,
            externalEventId: event.id,
            calendarEventId: existing.id,
            action: 'DELETE',
            resolution: 'SOVEREIGN_WINS',
          },
        });
        return;
      }

      // Conflict detection: has the Sovereign event been modified since last sync?
      const hasConflict =
        existing.lastSyncedAt &&
        existing.updatedAt > existing.lastSyncedAt;

      let resolution: 'SOVEREIGN_WINS' | 'EXTERNAL_ACCEPTED' = config.sovereignWins
        ? 'SOVEREIGN_WINS'
        : 'EXTERNAL_ACCEPTED';

      if (hasConflict && config.sovereignWins) {
        // Sovereign wins -- log conflict but don't overwrite
        await this.prisma.calendarSyncLog.create({
          data: {
            syncConfigId: config.id,
            direction: config.direction as any,
            externalEventId: event.id,
            calendarEventId: existing.id,
            action: 'CONFLICT',
            resolution: 'SOVEREIGN_WINS',
            hasConflict: true,
            sovereignData: {
              title: existing.title,
              startTime: existing.startTime.toISOString(),
              endTime: existing.endTime.toISOString(),
            },
            externalData: {
              summary: event.summary,
              start: event.start,
              end: event.end,
            },
          },
        });
        // Still update the hash so we don't re-process next time
        await this.prisma.calendarEvent.update({
          where: { id: existing.id },
          data: {
            externalEventHash: eventHash,
            lastSyncedAt: new Date(),
          },
        });
        return;
      }

      // External wins or no conflict -- update the Sovereign event
      resolution = hasConflict ? 'EXTERNAL_ACCEPTED' : 'EXTERNAL_ACCEPTED';

      await this.prisma.calendarEvent.update({
        where: { id: existing.id },
        data: {
          title: event.summary || 'Untitled',
          description: event.description || undefined,
          startTime,
          endTime,
          isAllDay,
          location: event.location || undefined,
          externalEventHash: eventHash,
          lastSyncedAt: new Date(),
        },
      });

      await this.prisma.calendarSyncLog.create({
        data: {
          syncConfigId: config.id,
          direction: config.direction as any,
          externalEventId: event.id,
          calendarEventId: existing.id,
          action: 'UPDATE',
          resolution,
          hasConflict: !!hasConflict,
          ...(hasConflict
            ? {
                sovereignData: {
                  title: existing.title,
                  startTime: existing.startTime.toISOString(),
                  endTime: existing.endTime.toISOString(),
                },
                externalData: {
                  summary: event.summary,
                  start: event.start,
                  end: event.end,
                },
                resolvedData: {
                  summary: event.summary,
                  start: event.start,
                  end: event.end,
                },
              }
            : {}),
        },
      });
    } else {
      // New event -- create if autoImportNewEvents is enabled
      if (!config.autoImportNewEvents) {
        return;
      }

      // Skip cancelled events we never imported
      if (isCancelled) {
        return;
      }

      const created = await this.prisma.calendarEvent.create({
        data: {
          userId,
          title: event.summary || 'Untitled',
          description: event.description || undefined,
          startTime,
          endTime,
          isAllDay,
          location: event.location || undefined,
          eventType,
          isProtected: false,
          source: 'GOOGLE',
          externalCalendarId: event.id,
          externalEventHash: eventHash,
          lastSyncedAt: new Date(),
        },
      });

      await this.prisma.calendarSyncLog.create({
        data: {
          syncConfigId: config.id,
          direction: config.direction as any,
          externalEventId: event.id,
          calendarEventId: created.id,
          action: 'CREATE',
          resolution: 'EXTERNAL_ACCEPTED',
        },
      });
    }
  }

  // ── Stub for unimplemented providers ──

  private async syncStub(
    userId: string,
    config: { id: string; source: string; direction: string; lastSyncAt: Date | null },
  ): Promise<number> {
    // Log the sync attempt for tracking
    const eventsToSync = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        source: config.source as any,
        updatedAt: config.lastSyncAt ? { gt: config.lastSyncAt } : undefined,
      },
    });

    await this.prisma.calendarSyncLog.create({
      data: {
        syncConfigId: config.id,
        direction: config.direction as any,
        action: 'SYNC',
        resolution: 'SOVEREIGN_WINS',
      },
    });

    return eventsToSync.length;
  }
}
