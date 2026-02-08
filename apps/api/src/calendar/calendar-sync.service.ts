import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateSyncConfigDto } from './dto/create-sync-config.dto';
import { UpdateSyncConfigDto } from './dto/update-sync-config.dto';

/**
 * Calendar Sync Service — Sovereign Always Wins
 *
 * Manages external calendar connections and handles sync conflict resolution.
 * When Sovereign and external calendars disagree, Sovereign's version is the
 * source of truth and is pushed to the external system.
 *
 * Actual API calls to Google/Outlook are deferred to a future integration phase.
 * This service handles the data model, conflict resolution logic, and audit trail.
 */
@Injectable()
export class CalendarSyncService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Sync Config CRUD ──

  async createConfig(userId: string, dto: CreateSyncConfigDto) {
    return this.prisma.calendarSyncConfig.create({
      data: {
        ...dto,
        userId,
        status: 'ACTIVE',
      },
    });
  }

  async findAllConfigs(userId: string) {
    return this.prisma.calendarSyncConfig.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneConfig(userId: string, id: string) {
    const config = await this.prisma.calendarSyncConfig.findFirst({
      where: { id, userId },
    });
    if (!config) throw new NotFoundException('Sync config not found');
    return config;
  }

  async updateConfig(userId: string, id: string, dto: UpdateSyncConfigDto) {
    await this.findOneConfig(userId, id);
    return this.prisma.calendarSyncConfig.update({
      where: { id },
      data: dto,
    });
  }

  async removeConfig(userId: string, id: string) {
    await this.findOneConfig(userId, id);
    return this.prisma.calendarSyncConfig.delete({ where: { id } });
  }

  // ── Sync Logs ──

  async findSyncLogs(syncConfigId: string, limit = 50) {
    return this.prisma.calendarSyncLog.findMany({
      where: { syncConfigId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ── Conflict Resolution (Sovereign Always Wins) ──

  /**
   * Resolve a sync conflict. Sovereign data is always the source of truth.
   *
   * When an inbound sync detects a conflict between the external version
   * and Sovereign's version:
   * 1. Log both versions for audit
   * 2. Keep Sovereign's version
   * 3. Queue an outbound push to overwrite the external version
   */
  async resolveConflict(
    syncConfigId: string,
    externalEventId: string,
    calendarEventId: string | null,
    sovereignData: Record<string, unknown>,
    externalData: Record<string, unknown>,
  ) {
    const config = await this.prisma.calendarSyncConfig.findUnique({
      where: { id: syncConfigId },
    });
    if (!config) throw new NotFoundException('Sync config not found');

    // Sovereign always wins — resolved data is the Sovereign version
    const resolution = config.sovereignWins ? 'SOVEREIGN_WINS' : 'MERGED';
    const resolvedData = config.sovereignWins ? sovereignData : { ...externalData, ...sovereignData };

    const log = await this.prisma.calendarSyncLog.create({
      data: {
        syncConfigId,
        direction: 'INBOUND',
        externalEventId,
        calendarEventId,
        action: 'CONFLICT',
        resolution,
        hasConflict: true,
        sovereignData: sovereignData as Prisma.InputJsonValue,
        externalData: externalData as Prisma.InputJsonValue,
        resolvedData: resolvedData as Prisma.InputJsonValue,
      },
    });

    return { log, resolvedData };
  }

  /**
   * Record a successful sync operation (no conflict).
   */
  async logSyncAction(
    syncConfigId: string,
    direction: 'INBOUND' | 'OUTBOUND',
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    externalEventId: string | null,
    calendarEventId: string | null,
  ) {
    return this.prisma.calendarSyncLog.create({
      data: {
        syncConfigId,
        direction,
        action,
        externalEventId,
        calendarEventId,
        resolution: 'SOVEREIGN_WINS',
        hasConflict: false,
      },
    });
  }

  /**
   * Record a sync error.
   */
  async logSyncError(syncConfigId: string, errorMessage: string) {
    await this.prisma.calendarSyncLog.create({
      data: {
        syncConfigId,
        direction: 'INBOUND',
        action: 'CONFLICT',
        resolution: 'ERROR',
        hasConflict: false,
        errorMessage,
      },
    });

    // Update config status
    await this.prisma.calendarSyncConfig.update({
      where: { id: syncConfigId },
      data: {
        status: 'ERROR',
        lastSyncError: errorMessage,
      },
    });
  }

  /**
   * Mark a sync config as completed for this cycle.
   */
  async markSyncComplete(syncConfigId: string) {
    const now = new Date();
    const config = await this.prisma.calendarSyncConfig.findUnique({
      where: { id: syncConfigId },
    });
    if (!config) return;

    const nextSync = new Date(now.getTime() + config.syncIntervalMinutes * 60 * 1000);

    await this.prisma.calendarSyncConfig.update({
      where: { id: syncConfigId },
      data: {
        lastSyncAt: now,
        nextSyncAt: nextSync,
        status: 'ACTIVE',
        lastSyncError: null,
      },
    });
  }

  /**
   * Get configs that are due for sync.
   */
  async getConfigsDueForSync() {
    return this.prisma.calendarSyncConfig.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { nextSyncAt: null },
          { nextSyncAt: { lte: new Date() } },
        ],
      },
      include: { user: true },
    });
  }
}
