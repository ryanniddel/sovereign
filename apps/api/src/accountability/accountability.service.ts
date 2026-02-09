import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StreaksService } from './streaks.service';
import { AccountabilityQueryDto } from './dto/accountability-query.dto';

const PRIORITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

@Injectable()
export class AccountabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly streaksService: StreaksService,
  ) {}

  // ════════════════════════════════════════════════════════════════
  // SCORES
  // ════════════════════════════════════════════════════════════════

  async getScores(userId: string, query: AccountabilityQueryDto) {
    const where: Record<string, unknown> = { userId };
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) (where.date as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.date as Record<string, unknown>).lte = new Date(query.endDate);
    }

    return this.prisma.accountabilityScore.findMany({
      where: where as any,
      orderBy: { date: 'desc' },
    });
  }

  async getLatestScore(userId: string) {
    return this.prisma.accountabilityScore.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Calculate daily accountability score with priority-weighted scoring.
   * Includes both commitments AND action items in the calculation.
   * Score = 60% priority-weighted delivery + 40% on-time rate
   */
  async calculateDailyScore(userId: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Commitment counts
    const [commitmentsMade, commitmentsDelivered, commitmentsMissed] = await Promise.all([
      this.prisma.commitment.count({
        where: { userId, createdAt: { gte: dayStart, lte: dayEnd } },
      }),
      this.prisma.commitment.count({
        where: { userId, status: 'COMPLETED', completedAt: { gte: dayStart, lte: dayEnd } },
      }),
      this.prisma.commitment.count({
        where: { userId, status: 'OVERDUE', dueDate: { gte: dayStart, lte: dayEnd } },
      }),
    ]);

    // Action item counts
    const [actionItemsCompleted, actionItemsMissed] = await Promise.all([
      this.prisma.actionItem.count({
        where: { userId, status: 'COMPLETED', completedAt: { gte: dayStart, lte: dayEnd } },
      }),
      this.prisma.actionItem.count({
        where: { userId, status: 'OVERDUE', dueDate: { gte: dayStart, lte: dayEnd } },
      }),
    ]);

    // Delegation & reschedule counts
    const [delegatedCount, rescheduledCommitments, rescheduledActionItems] = await Promise.all([
      this.prisma.commitment.count({
        where: { userId, status: 'DELEGATED', delegatedAt: { gte: dayStart, lte: dayEnd } },
      }),
      this.prisma.commitment.count({
        where: { userId, status: 'RESCHEDULED', updatedAt: { gte: dayStart, lte: dayEnd } },
      }),
      this.prisma.actionItem.count({
        where: { userId, status: 'RESCHEDULED', updatedAt: { gte: dayStart, lte: dayEnd } },
      }),
    ]);
    const rescheduledCount = rescheduledCommitments + rescheduledActionItems;

    // Priority-weighted score
    const [completedCommitments, overdueCommitments, completedActions, overdueActions] = await Promise.all([
      this.prisma.commitment.findMany({
        where: { userId, status: 'COMPLETED', completedAt: { gte: dayStart, lte: dayEnd } },
        select: { priority: true },
      }),
      this.prisma.commitment.findMany({
        where: { userId, status: 'OVERDUE', dueDate: { gte: dayStart, lte: dayEnd } },
        select: { priority: true },
      }),
      this.prisma.actionItem.findMany({
        where: { userId, status: 'COMPLETED', completedAt: { gte: dayStart, lte: dayEnd } },
        select: { priority: true },
      }),
      this.prisma.actionItem.findMany({
        where: { userId, status: 'OVERDUE', dueDate: { gte: dayStart, lte: dayEnd } },
        select: { priority: true },
      }),
    ]);

    const completedWeight = [...completedCommitments, ...completedActions]
      .reduce((sum, item) => sum + (PRIORITY_WEIGHTS[item.priority] || 2), 0);
    const missedWeight = [...overdueCommitments, ...overdueActions]
      .reduce((sum, item) => sum + (PRIORITY_WEIGHTS[item.priority] || 2), 0);
    const totalWeight = completedWeight + missedWeight;

    const priorityWeightedScore = totalWeight > 0
      ? Math.round((completedWeight / totalWeight) * 100)
      : 100;

    // On-time rate (commitments only, backward-compatible)
    const totalCommitmentsDue = commitmentsDelivered + commitmentsMissed;
    const onTimeRate = totalCommitmentsDue > 0 ? commitmentsDelivered / totalCommitmentsDue : 1;

    // Combined score: 60% priority-weighted + 40% on-time rate
    const score = Math.round(priorityWeightedScore * 0.6 + (onTimeRate * 100) * 0.4);

    return this.prisma.accountabilityScore.upsert({
      where: { userId_date: { userId, date: dayStart } },
      create: {
        userId,
        date: dayStart,
        score,
        commitmentsMade,
        commitmentsDelivered,
        commitmentsMissed,
        onTimeRate: Math.round(onTimeRate * 100) / 100,
        actionItemsCompleted,
        actionItemsMissed,
        priorityWeightedScore,
        delegatedCount,
        rescheduledCount,
      },
      update: {
        score,
        commitmentsMade,
        commitmentsDelivered,
        commitmentsMissed,
        onTimeRate: Math.round(onTimeRate * 100) / 100,
        actionItemsCompleted,
        actionItemsMissed,
        priorityWeightedScore,
        delegatedCount,
        rescheduledCount,
      },
    });
  }

  // ════════════════════════════════════════════════════════════════
  // TRENDS
  // ════════════════════════════════════════════════════════════════

  async getTrend(userId: string, days: number) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const scores = await this.prisma.accountabilityScore.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    if (scores.length === 0) {
      return {
        period: `${days}d`,
        averageScore: 0,
        averagePriorityWeightedScore: 0,
        totalCommitmentsMade: 0,
        totalCommitmentsDelivered: 0,
        totalCommitmentsMissed: 0,
        totalActionItemsCompleted: 0,
        totalActionItemsMissed: 0,
        onTimeRate: 0,
        direction: 'STABLE' as const,
        changePercent: 0,
        scores,
      };
    }

    const avgScore = scores.reduce((s, sc) => s + sc.score, 0) / scores.length;
    const avgPWS = scores.reduce((s, sc) => s + sc.priorityWeightedScore, 0) / scores.length;
    const totalMade = scores.reduce((s, sc) => s + sc.commitmentsMade, 0);
    const totalDelivered = scores.reduce((s, sc) => s + sc.commitmentsDelivered, 0);
    const totalMissed = scores.reduce((s, sc) => s + sc.commitmentsMissed, 0);
    const totalAICompleted = scores.reduce((s, sc) => s + sc.actionItemsCompleted, 0);
    const totalAIMissed = scores.reduce((s, sc) => s + sc.actionItemsMissed, 0);
    const overallOnTime = (totalDelivered + totalMissed) > 0
      ? totalDelivered / (totalDelivered + totalMissed)
      : 1;

    // Direction: compare first half avg to second half avg
    const mid = Math.floor(scores.length / 2);
    const firstHalf = scores.slice(0, Math.max(mid, 1));
    const secondHalf = scores.slice(Math.max(mid, 1));
    const firstAvg = firstHalf.reduce((s, sc) => s + sc.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.length > 0
      ? secondHalf.reduce((s, sc) => s + sc.score, 0) / secondHalf.length
      : firstAvg;

    const changePct = firstAvg > 0
      ? Math.round(((secondAvg - firstAvg) / firstAvg) * 100)
      : 0;

    let direction: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (changePct > 5) direction = 'UP';
    else if (changePct < -5) direction = 'DOWN';

    return {
      period: `${days}d`,
      averageScore: Math.round(avgScore * 100) / 100,
      averagePriorityWeightedScore: Math.round(avgPWS * 100) / 100,
      totalCommitmentsMade: totalMade,
      totalCommitmentsDelivered: totalDelivered,
      totalCommitmentsMissed: totalMissed,
      totalActionItemsCompleted: totalAICompleted,
      totalActionItemsMissed: totalAIMissed,
      onTimeRate: Math.round(overallOnTime * 100) / 100,
      direction,
      changePercent: changePct,
      scores,
    };
  }

  // ════════════════════════════════════════════════════════════════
  // OVERDUE DETECTION
  // ════════════════════════════════════════════════════════════════

  async detectAndMarkOverdue(userId?: string) {
    const now = new Date();
    const where: Record<string, unknown> = {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      dueDate: { lt: now },
    };
    if (userId) where.userId = userId;

    const [overdueCommitments, overdueActionItems] = await Promise.all([
      this.prisma.commitment.updateMany({
        where: where as any,
        data: { status: 'OVERDUE' },
      }),
      this.prisma.actionItem.updateMany({
        where: where as any,
        data: { status: 'OVERDUE' },
      }),
    ]);

    return {
      commitmentsMarkedOverdue: overdueCommitments.count,
      actionItemsMarkedOverdue: overdueActionItems.count,
    };
  }

  // ════════════════════════════════════════════════════════════════
  // UNIFIED ITEMS
  // ════════════════════════════════════════════════════════════════

  async getUnifiedItems(userId: string, filter?: string) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    let commitmentWhere: Record<string, unknown> = { userId };
    let actionItemWhere: Record<string, unknown> = { userId };

    if (filter === 'overdue') {
      commitmentWhere.status = 'OVERDUE';
      actionItemWhere.status = 'OVERDUE';
    } else if (filter === 'due-today') {
      commitmentWhere.dueDate = { gte: todayStart, lte: todayEnd };
      commitmentWhere.status = { in: ['PENDING', 'IN_PROGRESS'] };
      actionItemWhere.dueDate = { gte: todayStart, lte: todayEnd };
      actionItemWhere.status = { in: ['PENDING', 'IN_PROGRESS'] };
    } else if (filter === 'upcoming') {
      commitmentWhere.dueDate = { gt: todayEnd };
      commitmentWhere.status = { in: ['PENDING', 'IN_PROGRESS'] };
      actionItemWhere.dueDate = { gt: todayEnd };
      actionItemWhere.status = { in: ['PENDING', 'IN_PROGRESS'] };
    } else {
      commitmentWhere.status = { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] };
      actionItemWhere.status = { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] };
    }

    const [commitments, actionItems] = await Promise.all([
      this.prisma.commitment.findMany({
        where: commitmentWhere as any,
        include: { meeting: true, escalationRule: true },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.actionItem.findMany({
        where: actionItemWhere as any,
        include: { meeting: true, escalationRule: true },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    // Merge and sort by urgency: overdue first, then priority, then due date
    const items = [
      ...commitments.map((c) => ({ ...c, itemType: 'commitment' as const })),
      ...actionItems.map((a) => ({ ...a, itemType: 'actionItem' as const })),
    ].sort((a, b) => {
      if (a.status === 'OVERDUE' && b.status !== 'OVERDUE') return -1;
      if (b.status === 'OVERDUE' && a.status !== 'OVERDUE') return 1;
      const aWeight = PRIORITY_WEIGHTS[a.priority] || 2;
      const bWeight = PRIORITY_WEIGHTS[b.priority] || 2;
      if (aWeight !== bWeight) return bWeight - aWeight;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    return {
      items,
      counts: {
        commitments: commitments.length,
        actionItems: actionItems.length,
        total: items.length,
      },
    };
  }

  // ════════════════════════════════════════════════════════════════
  // ENHANCED DASHBOARD
  // ════════════════════════════════════════════════════════════════

  async getDashboard(userId: string) {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [
      latestScore,
      streaks,
      sevenDay,
      thirtyDay,
      ninetyDay,
      overdueCommitments,
      overdueActionItems,
      dueTodayCommitments,
      dueTodayActionItems,
      activeAgreements,
      todayCloseout,
    ] = await Promise.all([
      this.getLatestScore(userId),
      this.streaksService.getUserStreaks(userId),
      this.getTrend(userId, 7),
      this.getTrend(userId, 30),
      this.getTrend(userId, 90),
      this.prisma.commitment.count({ where: { userId, status: 'OVERDUE' } }),
      this.prisma.actionItem.count({ where: { userId, status: 'OVERDUE' } }),
      this.prisma.commitment.count({
        where: { userId, dueDate: { gte: todayStart, lte: todayEnd }, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),
      this.prisma.actionItem.count({
        where: { userId, dueDate: { gte: todayStart, lte: todayEnd }, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      }),
      this.prisma.agreement.count({ where: { userId, isActive: true } }),
      this.prisma.dailyCloseout.findUnique({
        where: { userId_date: { userId, date: todayStart } },
      }),
    ]);

    return {
      latestScore,
      streaks,
      trends: { sevenDay, thirtyDay, ninetyDay },
      overdueItems: { commitments: overdueCommitments, actionItems: overdueActionItems },
      dueToday: { commitments: dueTodayCommitments, actionItems: dueTodayActionItems },
      activeAgreements,
      lastCloseoutCompleted: todayCloseout?.isCompleted ?? false,
    };
  }

  async getStreaks(userId: string) {
    return this.streaksService.getUserStreaks(userId);
  }

  // ════════════════════════════════════════════════════════════════
  // BENCHMARKS
  // ════════════════════════════════════════════════════════════════

  async getBenchmarks(userId: string) {
    const allScores = await this.prisma.accountabilityScore.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    if (allScores.length === 0) {
      return {
        personalBest: 0,
        personalWorst: 0,
        lifetimeAverage: 0,
        last7DayAvg: 0,
        last30DayAvg: 0,
        last90DayAvg: 0,
        totalDaysTracked: 0,
        percentile: { last7InLifetime: 0, last30InLifetime: 0 },
        streakRecords: { longestCloseout: 0, longestDelivery: 0, longestOnTime: 0 },
        milestones: {
          daysAbove80: 0,
          daysAbove90: 0,
          perfectDays: 0,
          totalCompleted: 0,
          totalDelegated: 0,
          totalRescheduled: 0,
        },
      };
    }

    const scores = allScores.map((s) => s.score);
    const personalBest = Math.max(...scores);
    const personalWorst = Math.min(...scores);
    const lifetimeAverage = Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) / 100;

    // Period averages
    const now = new Date();
    const avg = (days: number) => {
      const since = new Date(now);
      since.setDate(since.getDate() - days);
      const periodScores = allScores.filter((s) => s.date >= since).map((s) => s.score);
      return periodScores.length > 0
        ? Math.round((periodScores.reduce((a, b) => a + b, 0) / periodScores.length) * 100) / 100
        : 0;
    };

    const last7DayAvg = avg(7);
    const last30DayAvg = avg(30);
    const last90DayAvg = avg(90);

    // Percentile: where does recent performance rank vs lifetime
    const calcPercentile = (recentAvg: number) => {
      const below = scores.filter((s) => s < recentAvg).length;
      return Math.round((below / scores.length) * 100);
    };

    // Streak records
    const streaks = await this.streaksService.getUserStreaks(userId);
    const getStreak = (type: string) =>
      streaks.find((s: any) => s.streakType === type)?.longestCount ?? 0;

    // Milestones
    const daysAbove80 = scores.filter((s) => s >= 80).length;
    const daysAbove90 = scores.filter((s) => s >= 90).length;
    const perfectDays = scores.filter((s) => s === 100).length;
    const totalCompleted = allScores.reduce((s, sc) => s + sc.commitmentsDelivered + sc.actionItemsCompleted, 0);
    const totalDelegated = allScores.reduce((s, sc) => s + sc.delegatedCount, 0);
    const totalRescheduled = allScores.reduce((s, sc) => s + sc.rescheduledCount, 0);

    return {
      personalBest,
      personalWorst,
      lifetimeAverage,
      last7DayAvg,
      last30DayAvg,
      last90DayAvg,
      totalDaysTracked: allScores.length,
      percentile: {
        last7InLifetime: calcPercentile(last7DayAvg),
        last30InLifetime: calcPercentile(last30DayAvg),
      },
      streakRecords: {
        longestCloseout: getStreak('DAILY_CLOSEOUT'),
        longestDelivery: getStreak('COMMITMENT_DELIVERY'),
        longestOnTime: getStreak('ON_TIME'),
      },
      milestones: {
        daysAbove80,
        daysAbove90,
        perfectDays,
        totalCompleted,
        totalDelegated,
        totalRescheduled,
      },
    };
  }
}
