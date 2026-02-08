import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { parseTimeString } from '../common/helpers/date.helper';
import { Prisma } from '@prisma/client';

const PRIORITY_ORDER: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Preferences ──

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: [{ channel: 'asc' }, { context: 'asc' }],
    });
  }

  async upsertPreference(userId: string, dto: UpdateNotificationPreferenceDto) {
    const context = dto.context || 'ALL';
    return this.prisma.notificationPreference.upsert({
      where: {
        userId_channel_context: {
          userId,
          channel: dto.channel as any,
          context: context as any,
        },
      },
      create: {
        userId,
        channel: dto.channel as any,
        context: context as any,
        isEnabled: dto.isEnabled ?? true,
        priority: (dto.priority || 'MEDIUM') as any,
      },
      update: {
        isEnabled: dto.isEnabled,
        priority: dto.priority as any,
      },
    });
  }

  async initializeDefaults(userId: string) {
    const existing = await this.prisma.notificationPreference.findMany({ where: { userId } });
    if (existing.length > 0) return existing;

    const defaults = [
      { channel: 'IN_APP', context: 'ALL', priority: 'LOW', isEnabled: true },
      { channel: 'EMAIL', context: 'WORK_HOURS', priority: 'MEDIUM', isEnabled: true },
      { channel: 'EMAIL', context: 'AFTER_HOURS', priority: 'HIGH', isEnabled: true },
      { channel: 'SMS', context: 'ALL', priority: 'CRITICAL', isEnabled: true },
    ];

    return this.prisma.$transaction(
      defaults.map((d) =>
        this.prisma.notificationPreference.create({
          data: { userId, ...d } as any,
        }),
      ),
    );
  }

  // ── Delivery Decision ──

  async shouldDeliver(
    userId: string,
    channel: string,
    priority: string,
  ): Promise<{ deliver: boolean; reason?: string }> {
    // 1. Check active focus mode
    const activeFocus = await this.prisma.focusMode.findFirst({
      where: { userId, isActive: true },
    });

    if (activeFocus) {
      if (activeFocus.allowAll) {
        // Allow through
      } else if (activeFocus.allowCriticalOnly && priority !== 'CRITICAL') {
        return { deliver: false, reason: `Focus mode "${activeFocus.name}" blocks non-critical` };
      } else if (activeFocus.allowMeetingPrep) {
        // Allow meeting prep and critical
        if (priority !== 'CRITICAL' && priority !== 'HIGH') {
          return { deliver: false, reason: `Focus mode "${activeFocus.name}" allows meeting prep + critical only` };
        }
      } else if (!activeFocus.allowAll && !activeFocus.allowCriticalOnly && !activeFocus.allowMeetingPrep) {
        return { deliver: false, reason: `Focus mode "${activeFocus.name}" blocks all notifications` };
      }
    }

    // 2. Determine current context (work hours vs after hours)
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { deliver: false, reason: 'User not found' };

    const currentContext = this.getCurrentContext(user.workingHoursStart, user.workingHoursEnd, user.timezone);

    // 3. Check notification preferences for this channel + context
    const prefs = await this.prisma.notificationPreference.findMany({
      where: {
        userId,
        channel: channel as any,
        isEnabled: true,
        context: { in: [currentContext as any, 'ALL' as any] },
      },
    });

    if (prefs.length === 0) {
      // No enabled preference — check if ANY preference exists for this channel
      const anyPref = await this.prisma.notificationPreference.findFirst({
        where: { userId, channel: channel as any },
      });

      if (anyPref) {
        return { deliver: false, reason: `Channel ${channel} disabled for context ${currentContext}` };
      }
      // No preferences at all = default allow for IN_APP
      if (channel === 'IN_APP') return { deliver: true };
      return { deliver: false, reason: `No preference configured for channel ${channel}` };
    }

    // 4. Check priority threshold
    const minPriority = Math.min(...prefs.map((p) => PRIORITY_ORDER[p.priority] || 0));
    const notifPriority = PRIORITY_ORDER[priority] || 0;

    if (notifPriority < minPriority) {
      return { deliver: false, reason: `Priority ${priority} below minimum ${prefs[0].priority} for ${currentContext}` };
    }

    return { deliver: true };
  }

  // ── Create & Deliver Notification ──

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    category?: string;
    channel?: string;
    priority?: string;
    targetType?: string;
    targetId?: string;
    groupKey?: string;
  }) {
    const channel = data.channel || 'IN_APP';
    const priority = data.priority || 'MEDIUM';

    const { deliver, reason } = await this.shouldDeliver(data.userId, channel, priority);

    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        category: (data.category || 'SYSTEM') as any,
        channel: channel as any,
        priority: priority as any,
        targetType: data.targetType,
        targetId: data.targetId,
        groupKey: data.groupKey,
        deliveredAt: deliver ? new Date() : null,
        suppressed: !deliver,
        suppressionReason: reason || null,
      },
    });
  }

  // ── Inbox ──

  async getInbox(userId: string, query: NotificationQueryDto) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      isDismissed: false,
    };

    if (query.category) where.category = query.category;
    if (query.priority) where.priority = query.priority;
    if (query.unreadOnly) where.isRead = false;

    const [data, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: [{ isRead: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { data, total };
  }

  async getUnreadCount(userId: string) {
    const [total, byCategoryRaw] = await Promise.all([
      this.prisma.notification.count({
        where: { userId, isRead: false, isDismissed: false, suppressed: false },
      }),
      this.prisma.notification.groupBy({
        by: ['category'],
        where: { userId, isRead: false, isDismissed: false, suppressed: false },
        _count: true,
      }),
    ]);

    const byCategory: Record<string, number> = {};
    for (const item of byCategoryRaw) {
      byCategory[item.category] = item._count;
    }

    return { total, byCategory };
  }

  async markRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string, category?: string) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      isRead: false,
      isDismissed: false,
    };
    if (category) where.category = category as any;

    const result = await this.prisma.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    });

    return { markedRead: result.count };
  }

  async dismiss(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { isDismissed: true, dismissedAt: new Date(), isRead: true, readAt: notification.readAt || new Date() },
    });
  }

  async dismissAll(userId: string, category?: string) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      isDismissed: false,
    };
    if (category) where.category = category as any;

    const result = await this.prisma.notification.updateMany({
      where,
      data: { isDismissed: true, dismissedAt: new Date() },
    });

    return { dismissed: result.count };
  }

  // ── Stats ──

  async getStats(userId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const notifications = await this.prisma.notification.findMany({
      where: { userId, createdAt: { gte: since } },
    });

    const total = notifications.length;
    const unread = notifications.filter((n) => !n.isRead && !n.isDismissed && !n.suppressed).length;
    const suppressedCount = notifications.filter((n) => n.suppressed).length;
    const delivered = notifications.filter((n) => !n.suppressed).length;

    const byCategory: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const n of notifications) {
      byCategory[n.category] = (byCategory[n.category] || 0) + 1;
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
    }

    return {
      total,
      unread,
      byCategory,
      byPriority,
      suppressedCount,
      deliveryRate: total > 0 ? delivered / total : 1,
    };
  }

  // ── Cleanup ──

  async cleanupOld(userId: string, olderThanDays: number = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - olderThanDays);

    const result = await this.prisma.notification.deleteMany({
      where: {
        userId,
        createdAt: { lt: cutoff },
        isRead: true,
      },
    });

    return { deleted: result.count };
  }

  // ── Helpers ──

  private getCurrentContext(
    workingHoursStart: string,
    workingHoursEnd: string,
    timezone: string,
  ): string {
    const now = new Date();
    const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const currentHour = nowInTz.getHours();
    const currentMinute = nowInTz.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;

    const start = parseTimeString(workingHoursStart);
    const end = parseTimeString(workingHoursEnd);
    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;

    if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
      return 'WORK_HOURS';
    }
    return 'AFTER_HOURS';
  }
}
