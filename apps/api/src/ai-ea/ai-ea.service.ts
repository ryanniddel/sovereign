import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { QualifyMeetingEaDto } from './dto/qualify-meeting-ea.dto';
import { BulkCreateItemsDto } from './dto/bulk-create-items.dto';

@Injectable()
export class AiEaService {
  constructor(private readonly prisma: PrismaService) {}

  async getPendingMeetings(userId: string) {
    return this.prisma.meeting.findMany({
      where: { userId, status: 'REQUESTED' },
      include: { participants: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async qualifyMeeting(dto: QualifyMeetingEaDto) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: dto.meetingId } });
    if (!meeting) throw new NotFoundException('Meeting not found');

    if (dto.approved) {
      return this.prisma.meeting.update({
        where: { id: dto.meetingId },
        data: {
          status: 'QUALIFIED',
          isQualified: true,
          qualifiedAt: new Date(),
          qualifiedBy: 'AI_EA',
        },
      });
    } else {
      return this.prisma.meeting.update({
        where: { id: dto.meetingId },
        data: {
          status: 'CANCELLED',
          rejectionReason: dto.rejectionReason,
        },
      });
    }
  }

  async getSchedulingParams(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return {
      timezone: user.timezone,
      workingHoursStart: user.workingHoursStart,
      workingHoursEnd: user.workingHoursEnd,
      defaultHourlyRate: user.defaultHourlyRate,
    };
  }

  async getAvailableSlots(userId: string, date: string, durationMinutes: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const events = await this.prisma.calendarEvent.findMany({
      where: {
        userId,
        startTime: { gte: dayStart },
        endTime: { lte: dayEnd },
      },
      orderBy: { startTime: 'asc' },
    });

    const [startH, startM] = user.workingHoursStart.split(':').map(Number);
    const [endH, endM] = user.workingHoursEnd.split(':').map(Number);

    const workStart = new Date(dayStart);
    workStart.setHours(startH, startM);
    const workEnd = new Date(dayStart);
    workEnd.setHours(endH, endM);

    const slots: Array<{ start: string; end: string }> = [];
    let cursor = workStart.getTime();
    const duration = durationMinutes * 60 * 1000;

    const busy = events
      .map((e) => ({ start: e.startTime.getTime(), end: e.endTime.getTime() }))
      .sort((a, b) => a.start - b.start);

    for (const b of busy) {
      if (cursor + duration <= b.start) {
        slots.push({
          start: new Date(cursor).toISOString(),
          end: new Date(cursor + duration).toISOString(),
        });
      }
      cursor = Math.max(cursor, b.end);
    }

    if (cursor + duration <= workEnd.getTime()) {
      slots.push({
        start: new Date(cursor).toISOString(),
        end: new Date(cursor + duration).toISOString(),
      });
    }

    return slots;
  }

  async bulkCreateItems(dto: BulkCreateItemsDto) {
    const results: Record<string, unknown[]> = {
      actionItems: [],
      commitments: [],
      agreements: [],
    };

    if (dto.actionItems?.length) {
      for (const item of dto.actionItems) {
        const created = await this.prisma.actionItem.create({
          data: {
            userId: dto.userId,
            meetingId: dto.meetingId,
            title: item.title,
            description: item.description,
            ownerId: dto.userId,
            ownerType: 'USER',
            dueDate: new Date(item.dueDate),
          },
        });
        results.actionItems.push(created);
      }
    }

    if (dto.commitments?.length) {
      for (const item of dto.commitments) {
        const created = await this.prisma.commitment.create({
          data: {
            userId: dto.userId,
            meetingId: dto.meetingId,
            title: item.title,
            description: item.description,
            ownerId: dto.userId,
            ownerType: 'USER',
            dueDate: new Date(item.dueDate),
          },
        });
        results.commitments.push(created);
      }
    }

    if (dto.agreements?.length) {
      for (const item of dto.agreements) {
        const created = await this.prisma.agreement.create({
          data: {
            userId: dto.userId,
            meetingId: dto.meetingId,
            title: item.title,
            description: item.description,
            parties: item.parties,
            agreedAt: new Date(),
          },
        });
        results.agreements.push(created);
      }
    }

    return results;
  }

  async getContext(userId: string) {
    const [contacts, recentMeetings, activeCommitments, streaks] = await Promise.all([
      this.prisma.contact.findMany({
        where: { userId },
        include: { tier: true },
        take: 50,
      }),
      this.prisma.meeting.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { participants: true },
      }),
      this.prisma.commitment.findMany({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
      }),
      this.prisma.streak.findMany({ where: { userId } }),
    ]);

    return { contacts, recentMeetings, activeCommitments, streaks };
  }

  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const [pendingMeetings, overdueItems, latestScore, activeStreaks, activeFocusMode] =
      await Promise.all([
        this.prisma.meeting.count({ where: { userId, status: 'REQUESTED' } }),
        this.prisma.commitment.count({ where: { userId, status: 'OVERDUE' } }),
        this.prisma.accountabilityScore.findFirst({
          where: { userId },
          orderBy: { date: 'desc' },
        }),
        this.prisma.streak.findMany({ where: { userId, currentCount: { gt: 0 } } }),
        this.prisma.focusMode.findFirst({ where: { userId, isActive: true } }),
      ]);

    return {
      user: { id: user.id, name: user.name, timezone: user.timezone },
      pendingMeetings,
      overdueItems,
      accountabilityScore: latestScore?.score || 0,
      activeStreaks,
      activeFocusMode: activeFocusMode?.name || null,
    };
  }
}
