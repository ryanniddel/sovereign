import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { BriefingQueryDto } from './dto/briefing-query.dto';
import { UpdateBriefingPreferenceDto } from './dto/update-briefing-preference.dto';
import { BriefingType } from '@sovereign/shared';
import { todayInTimezone } from '../common/helpers/date.helper';
import { Prisma } from '@prisma/client';

const PRIORITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const REFLECTION_PROMPTS = [
  'What was your most impactful decision today?',
  'What would you do differently if you could replay today?',
  'Which commitment moved the needle most? Why?',
  'Who did you help today, and how can you do more of that?',
  'What distraction cost you the most time today?',
  'What are you most proud of from today?',
  'What one thing could you delegate tomorrow to free up your time?',
  'Did any meeting today surprise you? What did you learn?',
  'What pattern are you noticing in your overdue items?',
  'If you could only accomplish one thing tomorrow, what would it be?',
];

@Injectable()
export class BriefingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Query ──

  async findAll(userId: string, query: BriefingQueryDto) {
    const where: Prisma.BriefingWhereInput = { userId };
    if (query.type) where.type = query.type;
    if (query.date) where.date = new Date(query.date);

    return this.prisma.briefing.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  async getLatest(userId: string, type: BriefingType) {
    const briefing = await this.prisma.briefing.findFirst({
      where: { userId, type },
      orderBy: { date: 'desc' },
    });
    if (!briefing) throw new NotFoundException('No briefing found');
    return briefing;
  }

  async getForDate(userId: string, type: BriefingType, date: string) {
    const briefing = await this.prisma.briefing.findUnique({
      where: { userId_type_date: { userId, type, date: new Date(date) } },
    });
    if (!briefing) throw new NotFoundException('No briefing found for this date');
    return briefing;
  }

  async getToday(userId: string, timezone: string) {
    const today = todayInTimezone(timezone);
    const [morning, nightly] = await Promise.all([
      this.prisma.briefing.findUnique({
        where: { userId_type_date: { userId, type: 'MORNING', date: today } },
      }),
      this.prisma.briefing.findUnique({
        where: { userId_type_date: { userId, type: 'NIGHTLY', date: today } },
      }),
    ]);
    return { morning, nightly };
  }

  // ── Mark as read ──

  async markRead(userId: string, id: string) {
    const briefing = await this.prisma.briefing.findFirst({ where: { id, userId } });
    if (!briefing) throw new NotFoundException('Briefing not found');
    if (briefing.readAt) return briefing;

    return this.prisma.briefing.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  // ── Complete ──

  async completeBriefing(userId: string, id: string) {
    const briefing = await this.prisma.briefing.findFirst({ where: { id, userId } });
    if (!briefing) throw new NotFoundException('Briefing not found');

    return this.prisma.briefing.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        readAt: briefing.readAt || new Date(),
      },
    });
  }

  // ── Feedback ──

  async submitFeedback(userId: string, id: string, rating: number, notes?: string) {
    const briefing = await this.prisma.briefing.findFirst({ where: { id, userId } });
    if (!briefing) throw new NotFoundException('Briefing not found');

    return this.prisma.briefing.update({
      where: { id },
      data: { feedbackRating: rating, feedbackNotes: notes },
    });
  }

  // ── Preferences ──

  async getPreferences(userId: string) {
    let pref = await this.prisma.briefingPreference.findUnique({ where: { userId } });
    if (!pref) {
      pref = await this.prisma.briefingPreference.create({
        data: { userId },
      });
    }
    return pref;
  }

  async updatePreferences(userId: string, dto: UpdateBriefingPreferenceDto) {
    return this.prisma.briefingPreference.upsert({
      where: { userId },
      create: { userId, ...dto } as any,
      update: dto as any,
    });
  }

  // ── Morning Briefing Generation ──

  async generateMorningBriefing(userId: string, timezone: string) {
    const today = todayInTimezone(timezone);
    const tomorrow = new Date(today.getTime() + 86400000);
    const dayAfter = new Date(today.getTime() + 172800000);

    const prefs = await this.getPreferences(userId);

    const [
      schedule,
      commitmentsDue,
      actionItemsDue,
      overdueCommitments,
      overdueActions,
      latestScore,
      streaks,
      activeAgreements,
      tomorrowMeetings,
    ] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: {
          userId,
          startTime: { gte: today, lt: tomorrow },
        },
        orderBy: { startTime: 'asc' },
        take: prefs.maxScheduleItems,
        include: { meeting: true },
      }),
      this.prisma.commitment.findMany({
        where: {
          userId,
          dueDate: { gte: today, lt: tomorrow },
          status: { in: ['PENDING', 'IN_PROGRESS'] },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      }),
      prefs.includeActionItems
        ? this.prisma.actionItem.findMany({
            where: {
              userId,
              dueDate: { gte: today, lt: tomorrow },
              status: { in: ['PENDING', 'IN_PROGRESS'] },
            },
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
          })
        : [],
      this.prisma.commitment.findMany({
        where: { userId, status: 'OVERDUE' },
        take: prefs.maxOverdueItems,
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      }),
      this.prisma.actionItem.findMany({
        where: { userId, status: 'OVERDUE' },
        take: prefs.maxOverdueItems,
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      }),
      this.prisma.accountabilityScore.findFirst({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      prefs.includeStreaks ? this.prisma.streak.findMany({ where: { userId } }) : ([] as any[]),
      this.prisma.agreement.count({
        where: { userId, isActive: true },
      }),
      this.prisma.calendarEvent.findMany({
        where: {
          userId,
          eventType: 'MEETING',
          startTime: { gte: tomorrow, lt: dayAfter },
        },
        include: { meeting: true },
      }),
    ]);

    // Gather contact relationship context for today's meetings
    const todayMeetingIds = schedule
      .filter((e) => e.meetingId)
      .map((e) => e.meetingId!);

    const contactContext = await this.getContactContextForMeetings(userId, todayMeetingIds, schedule);

    // Build priority ranking: combine commitments + action items by priority weight
    const allDueToday = [
      ...commitmentsDue.map((c) => ({ title: c.title, weight: PRIORITY_WEIGHTS[c.priority] || 1 })),
      ...actionItemsDue.map((a) => ({ title: a.title, weight: PRIORITY_WEIGHTS[a.priority] || 1 })),
    ].sort((a, b) => b.weight - a.weight);

    const closeoutStreak = streaks.find((s) => s.type === 'DAILY_CLOSEOUT');
    const commitmentStreak = streaks.find((s) => s.type === 'COMMITMENT_DELIVERY');

    const content = {
      schedule: schedule.map((e) => ({
        time: e.startTime.toISOString(),
        title: e.title,
        type: e.eventType,
        ...(prefs.includeMeetingCosts && { meetingCost: e.meeting?.meetingCost }),
        prepReady: e.meeting ? !!(e.meeting.agendaSubmittedAt && e.meeting.preReadDistributedAt) : undefined,
      })),
      commitmentsDueToday: commitmentsDue.map((c) => ({
        id: c.id,
        title: c.title,
        priority: c.priority,
        dueDate: c.dueDate.toISOString(),
        owner: c.ownerId,
      })),
      actionItemsDueToday: actionItemsDue.map((a) => ({
        id: a.id,
        title: a.title,
        priority: a.priority,
        dueDate: a.dueDate.toISOString(),
      })),
      overdueItems: [
        ...overdueCommitments.map((c) => ({
          id: c.id,
          title: c.title,
          type: 'commitment' as const,
          originalDueDate: c.dueDate.toISOString(),
          escalationLevel: c.currentEscalationLevel,
          priority: c.priority,
        })),
        ...overdueActions.map((a) => ({
          id: a.id,
          title: a.title,
          type: 'actionItem' as const,
          originalDueDate: a.dueDate.toISOString(),
          escalationLevel: a.currentEscalationLevel,
          priority: a.priority,
        })),
      ].sort((a, b) => (PRIORITY_WEIGHTS[b.priority] || 1) - (PRIORITY_WEIGHTS[a.priority] || 1)),
      activeAgreements,
      metrics: {
        currentStreak: closeoutStreak?.currentCount || 0,
        longestStreak: closeoutStreak?.longestCount || 0,
        accountabilityScore: latestScore?.score || 0,
        priorityWeightedScore: latestScore?.priorityWeightedScore || 0,
        onTimeRate: latestScore?.onTimeRate || 0,
      },
      tomorrowPreview: {
        meetingCount: tomorrowMeetings.length,
        totalMeetingCost: tomorrowMeetings.reduce((sum, e) => sum + (e.meeting?.meetingCost || 0), 0),
        firstMeeting: tomorrowMeetings[0]?.startTime?.toISOString(),
      },
      contactContext,
      focusRecommendation: this.generateFocusRecommendation(
        schedule,
        commitmentsDue.length + actionItemsDue.length,
        overdueCommitments.length + overdueActions.length,
      ),
      aiInsight: this.generateMorningInsight(
        commitmentsDue.length,
        actionItemsDue.length,
        overdueCommitments.length + overdueActions.length,
        schedule.length,
        latestScore?.score || 0,
        commitmentStreak?.currentCount || 0,
      ),
      priorityRanking: allDueToday.map((i) => i.title),
      generatedAt: new Date().toISOString(),
    };

    return this.prisma.briefing.upsert({
      where: { userId_type_date: { userId, type: 'MORNING', date: today } },
      create: {
        userId,
        type: 'MORNING',
        date: today,
        content: content as any,
        deliveryChannel: prefs.morningChannel as any,
        deliveredAt: new Date(),
      },
      update: {
        content: content as any,
        deliveryChannel: prefs.morningChannel as any,
        deliveredAt: new Date(),
      },
    });
  }

  // ── Nightly Review Generation ──

  async generateNightlyReview(userId: string, timezone: string) {
    const today = todayInTimezone(timezone);
    const tomorrow = new Date(today.getTime() + 86400000);
    const dayAfter = new Date(today.getTime() + 172800000);

    const prefs = await this.getPreferences(userId);

    const [
      todayMeetings,
      openCommitments,
      openActionItems,
      todayScore,
      completedToday,
      completedActionsToday,
      tomorrowMeetings,
      streaks,
      activeAgreements,
      closeout,
    ] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where: {
          userId,
          eventType: 'MEETING',
          startTime: { gte: today, lt: tomorrow },
        },
        include: { meeting: true },
      }),
      this.prisma.commitment.findMany({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      }),
      this.prisma.actionItem.findMany({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      }),
      this.prisma.accountabilityScore.findFirst({
        where: { userId, date: today },
      }),
      this.prisma.commitment.count({
        where: { userId, completedAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.actionItem.count({
        where: { userId, completedAt: { gte: today, lt: tomorrow } },
      }),
      this.prisma.calendarEvent.findMany({
        where: {
          userId,
          eventType: 'MEETING',
          startTime: { gte: tomorrow, lt: dayAfter },
        },
        include: {
          meeting: {
            include: { participants: true },
          },
        },
        orderBy: { startTime: 'asc' },
      }),
      prefs.includeStreaks ? this.prisma.streak.findMany({ where: { userId } }) : ([] as any[]),
      this.prisma.agreement.count({ where: { userId, isActive: true } }),
      this.prisma.dailyCloseout.findFirst({
        where: { userId, date: today },
      }),
    ]);

    // Calculate today's recap
    const meetingsAttended = todayMeetings.filter(
      (e) => e.meeting && ['COMPLETED', 'IN_PROGRESS'].includes(e.meeting.status),
    ).length;
    const meetingCostTotal = todayMeetings.reduce((sum, e) => sum + (e.meeting?.meetingCost || 0), 0);

    // Determine trend
    const recentScores = await this.prisma.accountabilityScore.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 7,
    });
    let trendDirection: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (recentScores.length >= 3) {
      const recent = recentScores.slice(0, 3).reduce((s, r) => s + r.score, 0) / 3;
      const older = recentScores.slice(-3).reduce((s, r) => s + r.score, 0) / Math.min(3, recentScores.slice(-3).length);
      const change = ((recent - older) / (older || 1)) * 100;
      if (change > 5) trendDirection = 'UP';
      else if (change < -5) trendDirection = 'DOWN';
    }

    const content = {
      dayRecap: {
        meetingsAttended,
        meetingCostTotal,
        commitmentsCompleted: completedToday,
        commitmentsMissed: todayScore?.commitmentsMissed || 0,
        actionItemsCompleted: completedActionsToday,
        actionItemsMissed: todayScore?.actionItemsMissed || 0,
      },
      openItems: [
        ...openCommitments.map((c) => ({
          id: c.id,
          title: c.title,
          type: 'commitment' as const,
          status: c.status,
          priority: c.priority,
          dueDate: c.dueDate.toISOString(),
        })),
        ...openActionItems.map((a) => ({
          id: a.id,
          title: a.title,
          type: 'actionItem' as const,
          status: a.status,
          priority: a.priority,
          dueDate: a.dueDate.toISOString(),
        })),
      ].sort((a, b) => (PRIORITY_WEIGHTS[b.priority] || 1) - (PRIORITY_WEIGHTS[a.priority] || 1)),
      scorecard: {
        todayScore: todayScore?.score || 0,
        priorityWeightedScore: todayScore?.priorityWeightedScore || 0,
        commitmentsMade: todayScore?.commitmentsMade || 0,
        commitmentsDelivered: todayScore?.commitmentsDelivered || 0,
        commitmentsMissed: todayScore?.commitmentsMissed || 0,
        actionItemsCompleted: todayScore?.actionItemsCompleted || 0,
        actionItemsMissed: todayScore?.actionItemsMissed || 0,
        onTimeRate: todayScore?.onTimeRate || 0,
        trendDirection,
      },
      tomorrowPrep: tomorrowMeetings.map((e) => ({
        meetingTitle: e.title,
        startTime: e.startTime.toISOString(),
        meetingType: e.meeting?.meetingType,
        meetingCost: e.meeting?.meetingCost,
        preReadSent: !!e.meeting?.preReadDistributedAt,
        agendaConfirmed: !!e.meeting?.agendaSubmittedAt,
        participantCount: e.meeting?.participants?.length || 0,
      })),
      streaks: streaks.map((s) => ({
        type: s.type,
        current: s.currentCount,
        longest: s.longestCount,
      })),
      activeAgreements,
      closeoutStatus: {
        isCompleted: closeout?.isCompleted || false,
        completedAt: closeout?.completedAt?.toISOString(),
      },
      reflectionPrompt: prefs.includeReflectionPrompt
        ? REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)]
        : '',
      generatedAt: new Date().toISOString(),
    };

    return this.prisma.briefing.upsert({
      where: { userId_type_date: { userId, type: 'NIGHTLY', date: today } },
      create: {
        userId,
        type: 'NIGHTLY',
        date: today,
        content: content as any,
        deliveryChannel: prefs.nightlyChannel as any,
        deliveredAt: new Date(),
      },
      update: {
        content: content as any,
        deliveryChannel: prefs.nightlyChannel as any,
        deliveredAt: new Date(),
      },
    });
  }

  // ── Engagement Stats ──

  async getEngagementStats(userId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const briefings = await this.prisma.briefing.findMany({
      where: { userId, createdAt: { gte: since } },
    });

    const total = briefings.length;
    const read = briefings.filter((b) => b.readAt).length;
    const completed = briefings.filter((b) => b.isCompleted).length;
    const rated = briefings.filter((b) => b.feedbackRating !== null);
    const avgRating = rated.length > 0
      ? rated.reduce((sum, b) => sum + (b.feedbackRating || 0), 0) / rated.length
      : 0;

    const byType = {
      morning: {
        total: briefings.filter((b) => b.type === 'MORNING').length,
        read: briefings.filter((b) => b.type === 'MORNING' && b.readAt).length,
        completed: briefings.filter((b) => b.type === 'MORNING' && b.isCompleted).length,
      },
      nightly: {
        total: briefings.filter((b) => b.type === 'NIGHTLY').length,
        read: briefings.filter((b) => b.type === 'NIGHTLY' && b.readAt).length,
        completed: briefings.filter((b) => b.type === 'NIGHTLY' && b.isCompleted).length,
      },
    };

    return {
      total,
      readRate: total > 0 ? read / total : 0,
      completionRate: total > 0 ? completed / total : 0,
      averageRating: Math.round(avgRating * 10) / 10,
      ratingsCount: rated.length,
      byType,
    };
  }

  // ── Helpers ──

  private generateMorningInsight(
    commitmentsDue: number,
    actionItemsDue: number,
    overdueCount: number,
    meetingCount: number,
    score: number,
    streak: number,
  ): string {
    const totalDue = commitmentsDue + actionItemsDue;

    if (overdueCount > 5) {
      return `You have ${overdueCount} overdue items. Consider clearing at least 3 before taking on new work.`;
    }
    if (meetingCount > 5) {
      return `Heavy meeting day with ${meetingCount} scheduled. Protect focus time between meetings for your ${totalDue} due items.`;
    }
    if (totalDue === 0 && meetingCount === 0) {
      return 'Light day ahead — great time to tackle strategic work or clear your overdue backlog.';
    }
    if (score >= 90 && streak >= 7) {
      return `${streak}-day streak! Score at ${score}. Maintain momentum on your ${totalDue} items due today.`;
    }
    if (score < 60) {
      return `Score at ${score}. Focus on completing your highest-priority commitments to rebuild momentum.`;
    }
    return `${totalDue} items due today across ${meetingCount} meeting(s). Focus on your highest-priority commitments first.`;
  }

  /**
   * Gather contact DISC profiles and relationship scores for contacts in today's meetings.
   */
  private async getContactContextForMeetings(
    userId: string,
    meetingIds: string[],
    schedule: { meetingId?: string | null; title: string }[],
  ) {
    if (meetingIds.length === 0) return [];

    const participants = await this.prisma.meetingParticipant.findMany({
      where: { meetingId: { in: meetingIds } },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            company: true,
            discD: true,
            discI: true,
            discS: true,
            discC: true,
            relationshipScore: true,
          },
        },
      },
    });

    // Deduplicate contacts and attach meeting title
    const seen = new Set<string>();
    const context: {
      contactId: string;
      name: string;
      company?: string;
      discProfile?: { D: number; I: number; S: number; C: number };
      relationshipScore: number;
      meetingTitle: string;
    }[] = [];

    for (const p of participants) {
      if (!p.contact || seen.has(p.contact.id)) continue;
      seen.add(p.contact.id);

      const event = schedule.find((e) => e.meetingId === p.meetingId);
      const hasDisc = p.contact.discD || p.contact.discI || p.contact.discS || p.contact.discC;

      context.push({
        contactId: p.contact.id,
        name: p.contact.name,
        company: p.contact.company || undefined,
        discProfile: hasDisc
          ? { D: p.contact.discD ?? 0, I: p.contact.discI ?? 0, S: p.contact.discS ?? 0, C: p.contact.discC ?? 0 }
          : undefined,
        relationshipScore: p.contact.relationshipScore,
        meetingTitle: event?.title || '',
      });
    }

    return context;
  }

  /**
   * Generate focus recommendation based on schedule density and workload.
   */
  private generateFocusRecommendation(
    schedule: { startTime: Date; endTime: Date; eventType: string }[],
    totalDueItems: number,
    overdueCount: number,
  ): string {
    const meetings = schedule.filter((e) => e.eventType === 'MEETING');
    const totalMeetingHours = meetings.reduce((sum, m) => {
      return sum + (m.endTime.getTime() - m.startTime.getTime()) / (1000 * 60 * 60);
    }, 0);

    // Find the longest gap between meetings for deep work
    if (meetings.length >= 2) {
      const sorted = [...meetings].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      let longestGapMin = 0;
      let gapStart = '';
      let gapEnd = '';

      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = (sorted[i + 1].startTime.getTime() - sorted[i].endTime.getTime()) / (1000 * 60);
        if (gap > longestGapMin) {
          longestGapMin = gap;
          gapStart = sorted[i].endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          gapEnd = sorted[i + 1].startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
      }

      if (longestGapMin >= 60) {
        return `Best focus window: ${gapStart} – ${gapEnd} (${Math.round(longestGapMin / 60 * 10) / 10}h). Use this block for your ${overdueCount > 0 ? overdueCount + ' overdue items' : totalDueItems + ' due items'}.`;
      }
    }

    if (meetings.length === 0) {
      if (overdueCount > 3) {
        return `Meeting-free day — ideal for clearing your ${overdueCount} overdue items. Consider activating a focus mode.`;
      }
      return 'No meetings today — activate a focus mode and tackle your highest-priority work.';
    }

    if (totalMeetingHours > 5) {
      return `Heavy meeting load (${Math.round(totalMeetingHours)}h). Batch small tasks between meetings and defer deep work.`;
    }

    if (overdueCount > 0) {
      return `Clear ${overdueCount} overdue item${overdueCount > 1 ? 's' : ''} before your first meeting. Activate a focus mode for uninterrupted work.`;
    }

    return `${meetings.length} meeting${meetings.length > 1 ? 's' : ''} today. Block 1–2 hours of focus time for your ${totalDueItems} due items.`;
  }
}
