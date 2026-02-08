import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';

@Processor('sync')
export class CalendarSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(CalendarSyncProcessor.name);

  constructor(private readonly prisma: PrismaService) {
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
      // Simulate sync operation — actual API calls to Google/Outlook deferred to integration phase
      // For now, log the sync and update timestamps

      const eventsToSync = await this.prisma.calendarEvent.findMany({
        where: {
          userId,
          source: config.source,
          updatedAt: config.lastSyncAt ? { gt: config.lastSyncAt } : undefined,
        },
      });

      // Log the sync attempt
      await this.prisma.calendarSyncLog.create({
        data: {
          syncConfigId: config.id,
          direction: config.direction,
          action: 'SYNC',
          resolution: 'SOVEREIGN_WINS',
        },
      });

      // Update sync timestamps
      const now = new Date();
      const nextSync = new Date(now.getTime() + config.syncIntervalMinutes * 60 * 1000);

      await this.prisma.calendarSyncConfig.update({
        where: { id: config.id },
        data: {
          lastSyncAt: now,
          nextSyncAt: nextSync,
          lastSyncError: null,
        },
      });

      this.logger.log(
        `Calendar sync complete for config ${syncConfigId}: ${eventsToSync.length} events checked`,
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
}
