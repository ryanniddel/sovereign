import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BriefingQueryDto } from './dto/briefing-query.dto';
import { BriefingType } from '@sovereign/shared';
import { todayInTimezone } from '../common/helpers/date.helper';

@Injectable()
export class BriefingsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: BriefingQueryDto) {
    const where: Record<string, unknown> = { userId };
    if (query.type) where.type = query.type;
    if (query.date) where.date = new Date(query.date);

    return this.prisma.briefing.findMany({
      where: where as any,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async getLatest(userId: string, type: BriefingType) {
    const briefing = await this.prisma.briefing.findFirst({
      where: { userId, type },
      orderBy: { createdAt: 'desc' },
    });
    if (!briefing) throw new NotFoundException('No briefing found');
    return briefing;
  }

  async completeBriefing(userId: string, id: string) {
    const briefing = await this.prisma.briefing.findFirst({ where: { id, userId } });
    if (!briefing) throw new NotFoundException('Briefing not found');

    return this.prisma.briefing.update({
      where: { id },
      data: { isCompleted: true, completedAt: new Date() },
    });
  }

  async generateMorningBriefing(userId: string, timezone: string) {
    const today = todayInTimezone(timezone);

    const [schedule, commitmentsDue, overdueItems, latestScore, streaks] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: {
          userId,
          startTime: { gte: today, lt: new Date(today.getTime() + 86400000) },
        },
        orderBy: { startTime: 'asc' },
        include: { meeting: true },
      }),
      this.prisma.commitment.findMany({
        where: {
          userId,
          dueDate: { gte: today, lt: new Date(today.getTime() + 86400000) },
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.commitment.findMany({
        where: { userId, status: 'OVERDUE' },
        take: 10,
      }),
      this.prisma.accountabilityScore.findFirst({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      this.prisma.streak.findMany({ where: { userId } }),
    ]);

    const content = {
      schedule: schedule.map((e) => ({
        time: e.startTime.toISOString(),
        title: e.title,
        meetingCost: e.meeting?.meetingCost,
      })),
      commitmentsDueToday: commitmentsDue.map((c) => ({
        title: c.title,
        dueDate: c.dueDate.toISOString(),
        owner: c.ownerId,
      })),
      overdueItems: overdueItems.map((c) => ({
        title: c.title,
        originalDueDate: c.dueDate.toISOString(),
        escalationStatus: `Level ${c.currentEscalationLevel}`,
      })),
      metrics: {
        currentStreak: streaks.find((s) => s.type === 'DAILY_CLOSEOUT')?.currentCount || 0,
        accountabilityScore: latestScore?.score || 0,
      },
      aiInsight: 'Focus on your highest-priority commitments today.',
      priorityRanking: commitmentsDue.map((c) => c.title),
    };

    return this.prisma.briefing.upsert({
      where: { userId_type_date: { userId, type: 'MORNING', date: today } },
      create: {
        userId,
        type: 'MORNING',
        date: today,
        content: content as any,
        deliveredAt: new Date(),
      },
      update: {
        content: content as any,
        deliveredAt: new Date(),
      },
    });
  }

  async generateNightlyReview(userId: string, timezone: string) {
    const today = todayInTimezone(timezone);

    const [openCommitments, openActionItems, todayScore, tomorrowMeetings] = await Promise.all([
      this.prisma.commitment.findMany({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
      }),
      this.prisma.actionItem.findMany({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
      }),
      this.prisma.accountabilityScore.findFirst({
        where: { userId, date: today },
      }),
      this.prisma.calendarEvent.findMany({
        where: {
          userId,
          eventType: 'MEETING',
          startTime: {
            gte: new Date(today.getTime() + 86400000),
            lt: new Date(today.getTime() + 172800000),
          },
        },
        include: { meeting: true },
      }),
    ]);

    const content = {
      openItems: [
        ...openCommitments.map((c) => ({ id: c.id, title: c.title, type: 'commitment' as const, status: c.status })),
        ...openActionItems.map((a) => ({ id: a.id, title: a.title, type: 'actionItem' as const, status: a.status })),
      ],
      scorecard: {
        commitmentsMade: todayScore?.commitmentsMade || 0,
        commitmentsDelivered: todayScore?.commitmentsDelivered || 0,
        onTimeRate: todayScore?.onTimeRate || 0,
      },
      tomorrowPrep: tomorrowMeetings.map((e) => ({
        meetingTitle: e.title,
        preReadSent: !!e.meeting?.preReadDistributedAt,
        agendaConfirmed: !!e.meeting?.agendaSubmittedAt,
      })),
      reflectionPrompt: 'What was your most impactful decision today?',
    };

    return this.prisma.briefing.upsert({
      where: { userId_type_date: { userId, type: 'NIGHTLY', date: today } },
      create: {
        userId,
        type: 'NIGHTLY',
        date: today,
        content: content as any,
        deliveredAt: new Date(),
      },
      update: {
        content: content as any,
        deliveredAt: new Date(),
      },
    });
  }
}
