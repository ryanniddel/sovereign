import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { QUEUE_NAMES } from '../queue/queue.module';
import { CreateFocusModeDto } from './dto/create-focus-mode.dto';
import { UpdateFocusModeDto } from './dto/update-focus-mode.dto';
import { FocusModeSessionQueryDto } from './dto/focus-mode-session-query.dto';
import { parseTimeString } from '../common/helpers/date.helper';
import { Prisma } from '@prisma/client';

const DEFAULT_FOCUS_MODES = [
  {
    name: 'Deep Work',
    description: 'Block all non-critical notifications',
    allowCriticalOnly: true,
    allowMeetingPrep: false,
    allowAll: false,
    requires2faOverride: true,
    color: '#6366f1',
    icon: 'brain',
  },
  {
    name: 'Meeting Mode',
    description: 'Allow meeting prep notifications',
    allowCriticalOnly: false,
    allowMeetingPrep: true,
    allowAll: false,
    requires2faOverride: false,
    color: '#f59e0b',
    icon: 'users',
  },
  {
    name: 'Available',
    description: 'Allow all notifications',
    allowCriticalOnly: false,
    allowMeetingPrep: true,
    allowAll: true,
    requires2faOverride: false,
    color: '#22c55e',
    icon: 'check-circle',
  },
  {
    name: 'Off Hours',
    description: 'Critical only outside work hours',
    allowCriticalOnly: true,
    allowMeetingPrep: false,
    allowAll: false,
    requires2faOverride: true,
    color: '#8b5cf6',
    icon: 'moon',
  },
];

@Injectable()
export class FocusModesService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  // ── Defaults ──

  async seedDefaults(userId: string) {
    const existing = await this.prisma.focusMode.findMany({ where: { userId } });
    if (existing.length > 0) return existing;

    return this.prisma.$transaction(
      DEFAULT_FOCUS_MODES.map((mode) =>
        this.prisma.focusMode.create({ data: { ...mode, userId } }),
      ),
    );
  }

  // ── CRUD ──

  async create(userId: string, dto: CreateFocusModeDto) {
    return this.prisma.focusMode.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        allowCriticalOnly: dto.allowCriticalOnly ?? true,
        allowMeetingPrep: dto.allowMeetingPrep ?? false,
        allowAll: dto.allowAll ?? false,
        triggerType: dto.triggerType as any,
        triggerCalendarEventType: dto.triggerCalendarEventType as any,
        scheduleStartTime: dto.scheduleStartTime,
        scheduleEndTime: dto.scheduleEndTime,
        scheduleDays: dto.scheduleDays,
        autoDeactivateMinutes: dto.autoDeactivateMinutes,
        requires2faOverride: dto.requires2faOverride ?? true,
        color: dto.color,
        icon: dto.icon,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.focusMode.findMany({
      where: { userId },
      include: {
        _count: { select: { sessions: true, overrideRequests: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(userId: string, id: string) {
    const mode = await this.prisma.focusMode.findFirst({
      where: { id, userId },
      include: {
        _count: { select: { sessions: true, overrideRequests: true } },
        sessions: {
          orderBy: { activatedAt: 'desc' },
          take: 5,
        },
        overrideRequests: {
          where: { status: 'PENDING' as any },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!mode) throw new NotFoundException('Focus mode not found');
    return mode;
  }

  async update(userId: string, id: string, dto: UpdateFocusModeDto) {
    await this.findOne(userId, id);

    const data: Record<string, any> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.allowCriticalOnly !== undefined) data.allowCriticalOnly = dto.allowCriticalOnly;
    if (dto.allowMeetingPrep !== undefined) data.allowMeetingPrep = dto.allowMeetingPrep;
    if (dto.allowAll !== undefined) data.allowAll = dto.allowAll;
    if (dto.triggerType !== undefined) data.triggerType = dto.triggerType;
    if (dto.triggerCalendarEventType !== undefined) data.triggerCalendarEventType = dto.triggerCalendarEventType;
    if (dto.scheduleStartTime !== undefined) data.scheduleStartTime = dto.scheduleStartTime;
    if (dto.scheduleEndTime !== undefined) data.scheduleEndTime = dto.scheduleEndTime;
    if (dto.scheduleDays !== undefined) data.scheduleDays = dto.scheduleDays;
    if (dto.autoDeactivateMinutes !== undefined) data.autoDeactivateMinutes = dto.autoDeactivateMinutes;
    if (dto.requires2faOverride !== undefined) data.requires2faOverride = dto.requires2faOverride;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.icon !== undefined) data.icon = dto.icon;

    return this.prisma.focusMode.update({
      where: { id },
      data,
    });
  }

  async remove(userId: string, id: string) {
    const mode = await this.findOne(userId, id);
    if (mode.isActive) {
      await this.deactivate(userId, id, 'MANUAL');
    }
    return this.prisma.focusMode.delete({ where: { id } });
  }

  async cloneMode(userId: string, id: string) {
    const source = await this.findOne(userId, id);
    return this.prisma.focusMode.create({
      data: {
        userId,
        name: `${source.name} (copy)`,
        description: source.description,
        allowCriticalOnly: source.allowCriticalOnly,
        allowMeetingPrep: source.allowMeetingPrep,
        allowAll: source.allowAll,
        triggerType: source.triggerType,
        triggerCalendarEventType: source.triggerCalendarEventType,
        scheduleStartTime: source.scheduleStartTime,
        scheduleEndTime: source.scheduleEndTime,
        scheduleDays: source.scheduleDays as any,
        autoDeactivateMinutes: source.autoDeactivateMinutes,
        requires2faOverride: source.requires2faOverride,
        color: source.color,
        icon: source.icon,
        isActive: false,
      },
    });
  }

  // ── Activation / Deactivation ──

  async activate(userId: string, id: string) {
    const mode = await this.findOne(userId, id);
    if (mode.isActive) return mode;

    // Deactivate currently active mode (close its session)
    const currentActive = await this.prisma.focusMode.findFirst({
      where: { userId, isActive: true },
    });
    if (currentActive) {
      await this.deactivate(userId, currentActive.id, 'MANUAL');
    }

    // Activate the new mode
    const now = new Date();
    const activated = await this.prisma.focusMode.update({
      where: { id },
      data: {
        isActive: true,
        activatedAt: now,
        activationCount: { increment: 1 },
      },
    });

    // Create session record
    await this.prisma.focusModeSession.create({
      data: {
        userId,
        focusModeId: id,
        focusModeName: mode.name,
        activatedAt: now,
      },
    });

    // Send notification
    await this.notificationQueue.add('send-notification', {
      userId,
      title: 'Focus Mode Activated',
      message: `"${mode.name}" is now active. ${this.getFilterDescription(mode)}`,
      category: 'FOCUS_MODE',
      priority: 'LOW',
      targetType: 'FOCUS_MODE',
      targetId: id,
    });

    // Schedule auto-deactivation if configured
    if (mode.autoDeactivateMinutes) {
      await this.notificationQueue.add(
        'focus-mode-auto-deactivate',
        { userId, focusModeId: id, sessionActivatedAt: now.toISOString() },
        { delay: mode.autoDeactivateMinutes * 60 * 1000 },
      );
    }

    return activated;
  }

  async deactivate(
    userId: string,
    id: string,
    reason: string = 'MANUAL',
  ) {
    const mode = await this.prisma.focusMode.findFirst({
      where: { id, userId },
    });
    if (!mode) throw new NotFoundException('Focus mode not found');
    if (!mode.isActive) return mode;

    const now = new Date();

    // Close the open session
    const openSession = await this.prisma.focusModeSession.findFirst({
      where: { focusModeId: id, userId, deactivatedAt: null },
      orderBy: { activatedAt: 'desc' },
    });

    let durationMinutes = 0;
    if (openSession) {
      durationMinutes = Math.round(
        (now.getTime() - openSession.activatedAt.getTime()) / 60000,
      );

      // Count notifications suppressed/allowed during this session
      const [suppressed, allowed] = await Promise.all([
        this.prisma.notification.count({
          where: {
            userId,
            suppressed: true,
            createdAt: { gte: openSession.activatedAt, lte: now },
          },
        }),
        this.prisma.notification.count({
          where: {
            userId,
            suppressed: false,
            createdAt: { gte: openSession.activatedAt, lte: now },
          },
        }),
      ]);

      await this.prisma.focusModeSession.update({
        where: { id: openSession.id },
        data: {
          deactivatedAt: now,
          durationMinutes,
          deactivationReason: reason as any,
          notificationsSuppressed: suppressed,
          notificationsAllowed: allowed,
        },
      });
    }

    // Update cumulative stats
    const deactivated = await this.prisma.focusMode.update({
      where: { id },
      data: {
        isActive: false,
        totalActivationMinutes: { increment: durationMinutes },
      },
    });

    // Notify user
    if (reason !== 'MANUAL') {
      await this.notificationQueue.add('send-notification', {
        userId,
        title: 'Focus Mode Deactivated',
        message: `"${mode.name}" was deactivated (${this.getReasonLabel(reason)}). Duration: ${durationMinutes}min.`,
        category: 'FOCUS_MODE',
        priority: 'LOW',
        targetType: 'FOCUS_MODE',
        targetId: id,
      });
    }

    return deactivated;
  }

  async getActive(userId: string) {
    const mode = await this.prisma.focusMode.findFirst({
      where: { userId, isActive: true },
    });

    if (!mode) return null;

    // Include active session for duration tracking
    const activeSession = await this.prisma.focusModeSession.findFirst({
      where: { focusModeId: mode.id, userId, deactivatedAt: null },
      orderBy: { activatedAt: 'desc' },
    });

    // Count pending override requests
    const pendingOverrides = await this.prisma.focusModeOverrideRequest.count({
      where: { focusModeId: mode.id, status: 'PENDING' as any },
    });

    return {
      ...mode,
      activeSession,
      pendingOverrides,
      activeDurationMinutes: activeSession
        ? Math.round((Date.now() - activeSession.activatedAt.getTime()) / 60000)
        : 0,
    };
  }

  // ── 2FA Override (Ulysses Contract) ──

  async requestOverride(userId: string, focusModeId: string, requesterEmail: string, reason: string) {
    const mode = await this.findOne(userId, focusModeId);

    if (!mode.isActive) {
      throw new BadRequestException('Focus mode is not currently active');
    }

    if (!mode.requires2faOverride) {
      // No 2FA required — just deactivate directly
      return this.deactivate(userId, focusModeId, 'OVERRIDE');
    }

    // Check for existing pending request
    const existing = await this.prisma.focusModeOverrideRequest.findFirst({
      where: {
        focusModeId,
        status: 'PENDING' as any,
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      throw new BadRequestException('An override request is already pending. Use the existing code.');
    }

    // Generate 6-digit code
    const overrideCode = this.generateOverrideCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const request = await this.prisma.focusModeOverrideRequest.create({
      data: {
        userId,
        focusModeId,
        requesterEmail,
        reason,
        overrideCode,
        expiresAt,
      },
    });

    // Notify the user that an override was requested
    await this.notificationQueue.add('send-notification', {
      userId,
      title: 'Focus Mode Override Requested',
      message: `${requesterEmail} is requesting to override "${mode.name}": ${reason}. Code: ${overrideCode} (expires in 15min).`,
      category: 'FOCUS_MODE',
      priority: 'CRITICAL',
      targetType: 'FOCUS_MODE_OVERRIDE',
      targetId: request.id,
    });

    return {
      id: request.id,
      status: request.status,
      expiresAt: request.expiresAt,
      message: `Override code sent. Both the requester and user must confirm with the 6-digit code within 15 minutes.`,
    };
  }

  async resolveOverride(userId: string, overrideCode: string, resolverEmail?: string) {
    const request = await this.prisma.focusModeOverrideRequest.findFirst({
      where: {
        userId,
        overrideCode,
        status: 'PENDING' as any,
      },
    });

    if (!request) {
      throw new BadRequestException('Invalid or expired override code');
    }

    if (request.expiresAt < new Date()) {
      await this.prisma.focusModeOverrideRequest.update({
        where: { id: request.id },
        data: { status: 'EXPIRED' as any },
      });
      throw new BadRequestException('Override code has expired');
    }

    // Approve the override
    const resolved = await this.prisma.focusModeOverrideRequest.update({
      where: { id: request.id },
      data: {
        status: 'APPROVED' as any,
        resolvedAt: new Date(),
        resolvedByEmail: resolverEmail || 'user',
      },
    });

    // Deactivate the focus mode
    await this.deactivate(userId, request.focusModeId, 'OVERRIDE');

    return resolved;
  }

  async rejectOverride(userId: string, overrideRequestId: string) {
    const request = await this.prisma.focusModeOverrideRequest.findFirst({
      where: { id: overrideRequestId, userId },
    });

    if (!request) throw new NotFoundException('Override request not found');
    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Override request is already ${request.status}`);
    }

    return this.prisma.focusModeOverrideRequest.update({
      where: { id: overrideRequestId },
      data: {
        status: 'REJECTED' as any,
        resolvedAt: new Date(),
      },
    });
  }

  async getPendingOverrides(userId: string) {
    return this.prisma.focusModeOverrideRequest.findMany({
      where: {
        userId,
        status: 'PENDING' as any,
        expiresAt: { gt: new Date() },
      },
      include: { focusMode: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Session History ──

  async getSessions(userId: string, query: FocusModeSessionQueryDto) {
    const where: Prisma.FocusModeSessionWhereInput = { userId };

    if (query.focusModeId) where.focusModeId = query.focusModeId;
    if (query.from) where.activatedAt = { ...(where.activatedAt as any || {}), gte: new Date(query.from) };
    if (query.to) {
      const existing = (where.activatedAt as any) || {};
      where.activatedAt = { ...existing, lte: new Date(query.to) };
    }

    const [data, total] = await Promise.all([
      this.prisma.focusModeSession.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { activatedAt: 'desc' },
        include: { focusMode: { select: { name: true, color: true, icon: true } } },
      }),
      this.prisma.focusModeSession.count({ where }),
    ]);

    return { data, total };
  }

  // ── Suppressed Digest ──

  async getSuppressedDigest(userId: string) {
    const active = await this.prisma.focusMode.findFirst({
      where: { userId, isActive: true },
    });

    if (!active || !active.activatedAt) {
      return { focusMode: null, suppressed: [], count: 0 };
    }

    const suppressed = await this.prisma.notification.findMany({
      where: {
        userId,
        suppressed: true,
        createdAt: { gte: active.activatedAt },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });

    return {
      focusMode: { id: active.id, name: active.name },
      suppressed,
      count: suppressed.length,
    };
  }

  // ── Calendar Trigger Checks ──

  async checkCalendarTriggers(userId: string) {
    const calendarModes = await this.prisma.focusMode.findMany({
      where: {
        userId,
        triggerType: 'CALENDAR_EVENT' as any,
        triggerCalendarEventType: { not: null },
      },
    });

    if (calendarModes.length === 0) return [];

    const now = new Date();
    const results: { modeId: string; action: string; eventId?: string }[] = [];

    for (const mode of calendarModes) {
      // Check if there's an active calendar event matching the trigger type
      const activeEvent = await this.prisma.calendarEvent.findFirst({
        where: {
          userId,
          eventType: mode.triggerCalendarEventType!,
          startTime: { lte: now },
          endTime: { gt: now },
        },
      });

      if (activeEvent && !mode.isActive) {
        // Should be active — activate
        await this.activate(userId, mode.id);
        results.push({ modeId: mode.id, action: 'activated', eventId: activeEvent.id });
      } else if (!activeEvent && mode.isActive) {
        // Event ended — deactivate
        await this.deactivate(userId, mode.id, 'CALENDAR_EVENT_ENDED');
        results.push({ modeId: mode.id, action: 'deactivated' });
      }
    }

    return results;
  }

  // ── Schedule Trigger Checks ──

  async checkScheduledTriggers(userId: string) {
    const scheduledModes = await this.prisma.focusMode.findMany({
      where: {
        userId,
        triggerType: 'SCHEDULED' as any,
        scheduleStartTime: { not: null },
        scheduleEndTime: { not: null },
      },
    });

    if (scheduledModes.length === 0) return [];

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    const now = new Date();
    const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: user.timezone }));
    const currentDay = nowInTz.getDay(); // 0=Sun
    const currentMinutes = nowInTz.getHours() * 60 + nowInTz.getMinutes();

    const results: { modeId: string; action: string }[] = [];

    for (const mode of scheduledModes) {
      const days = (mode.scheduleDays as number[]) || [1, 2, 3, 4, 5]; // default weekdays
      const start = parseTimeString(mode.scheduleStartTime!);
      const end = parseTimeString(mode.scheduleEndTime!);
      const startMinutes = start.hours * 60 + start.minutes;
      const endMinutes = end.hours * 60 + end.minutes;

      const isScheduledNow =
        days.includes(currentDay) &&
        currentMinutes >= startMinutes &&
        currentMinutes < endMinutes;

      if (isScheduledNow && !mode.isActive) {
        await this.activate(userId, mode.id);
        results.push({ modeId: mode.id, action: 'activated' });
      } else if (!isScheduledNow && mode.isActive) {
        await this.deactivate(userId, mode.id, 'SCHEDULED');
        results.push({ modeId: mode.id, action: 'deactivated' });
      }
    }

    return results;
  }

  // ── Auto-Deactivation (called by processor) ──

  async handleAutoDeactivation(userId: string, focusModeId: string, sessionActivatedAt: string) {
    const mode = await this.prisma.focusMode.findFirst({
      where: { id: focusModeId, userId, isActive: true },
    });

    if (!mode) return null;

    // Verify the session matches (in case mode was reactivated after job was queued)
    if (mode.activatedAt && mode.activatedAt.toISOString() !== sessionActivatedAt) {
      return null; // Different activation session — skip
    }

    await this.deactivate(userId, focusModeId, 'AUTO_EXPIRED');
    return { deactivated: true, focusModeId, reason: 'AUTO_EXPIRED' };
  }

  // ── Analytics ──

  async getAnalytics(userId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [sessions, overrideRequests] = await Promise.all([
      this.prisma.focusModeSession.findMany({
        where: { userId, activatedAt: { gte: since } },
        include: { focusMode: { select: { name: true } } },
      }),
      this.prisma.focusModeOverrideRequest.findMany({
        where: { userId, createdAt: { gte: since } },
      }),
    ]);

    // By mode
    const modeMap: Record<string, {
      modeId: string;
      modeName: string;
      sessions: number;
      totalMinutes: number;
      notificationsSuppressed: number;
      notificationsAllowed: number;
    }> = {};

    let totalMinutes = 0;

    for (const s of sessions) {
      const duration = s.durationMinutes || 0;
      totalMinutes += duration;

      if (!modeMap[s.focusModeId]) {
        modeMap[s.focusModeId] = {
          modeId: s.focusModeId,
          modeName: s.focusModeName,
          sessions: 0,
          totalMinutes: 0,
          notificationsSuppressed: 0,
          notificationsAllowed: 0,
        };
      }
      modeMap[s.focusModeId].sessions++;
      modeMap[s.focusModeId].totalMinutes += duration;
      modeMap[s.focusModeId].notificationsSuppressed += s.notificationsSuppressed;
      modeMap[s.focusModeId].notificationsAllowed += s.notificationsAllowed;
    }

    // Override stats
    const approved = overrideRequests.filter((r) => r.status === 'APPROVED').length;
    const rejected = overrideRequests.filter((r) => r.status === 'REJECTED').length;
    const expired = overrideRequests.filter((r) => r.status === 'EXPIRED').length;

    // Suppression stats
    const totalSuppressed = sessions.reduce((sum, s) => sum + s.notificationsSuppressed, 0);
    const totalAllowed = sessions.reduce((sum, s) => sum + s.notificationsAllowed, 0);
    const totalNotifs = totalSuppressed + totalAllowed;

    // Activations by day of week
    const activationsByDay: Record<string, number> = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const s of sessions) {
      const day = dayNames[s.activatedAt.getDay()];
      activationsByDay[day] = (activationsByDay[day] || 0) + 1;
    }

    return {
      totalSessions: sessions.length,
      totalMinutes,
      averageSessionMinutes: sessions.length > 0 ? Math.round(totalMinutes / sessions.length) : 0,
      byMode: Object.values(modeMap),
      overrideStats: {
        totalRequests: overrideRequests.length,
        approved,
        rejected,
        expired,
      },
      suppressionStats: {
        totalSuppressed,
        totalAllowed,
        suppressionRate: totalNotifs > 0 ? totalSuppressed / totalNotifs : 0,
      },
      activationsByDay,
    };
  }

  // ── Bulk Trigger Check (called by scheduler processor) ──

  async checkAllTriggers() {
    // Find all users who have CALENDAR_EVENT or SCHEDULED focus modes
    const usersWithTriggers = await this.prisma.focusMode.findMany({
      where: {
        triggerType: { in: ['CALENDAR_EVENT' as any, 'SCHEDULED' as any] },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    const results: { userId: string; calendarResults: any[]; scheduleResults: any[] }[] = [];

    for (const { userId } of usersWithTriggers) {
      const [calendarResults, scheduleResults] = await Promise.all([
        this.checkCalendarTriggers(userId).catch(() => [] as any[]),
        this.checkScheduledTriggers(userId).catch(() => [] as any[]),
      ]);

      if (calendarResults.length > 0 || scheduleResults.length > 0) {
        results.push({ userId, calendarResults, scheduleResults });
      }
    }

    return results;
  }

  // ── Expire Override Requests ──

  async expirePendingOverrides() {
    const result = await this.prisma.focusModeOverrideRequest.updateMany({
      where: {
        status: 'PENDING' as any,
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' as any },
    });

    return { expired: result.count };
  }

  // ── Helpers ──

  private generateOverrideCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getFilterDescription(mode: any): string {
    if (mode.allowAll) return 'All notifications will come through.';
    if (mode.allowMeetingPrep) return 'Meeting prep and critical notifications only.';
    if (mode.allowCriticalOnly) return 'Only critical notifications will come through.';
    return 'All notifications blocked.';
  }

  private getReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      MANUAL: 'manually deactivated',
      SCHEDULED: 'schedule ended',
      CALENDAR_EVENT_ENDED: 'calendar event ended',
      AUTO_EXPIRED: 'auto-deactivation timer expired',
      OVERRIDE: '2FA override approved',
    };
    return labels[reason] || reason;
  }
}
