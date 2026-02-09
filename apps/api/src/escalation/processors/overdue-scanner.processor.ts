import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QUEUE_NAMES } from '../../queue/queue.module';

@Processor('escalation')
export class OverdueScannerProcessor extends WorkerHost {
  private readonly logger = new Logger(OverdueScannerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.ESCALATION) private readonly escalationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'overdue-scan') return;

    this.logger.log('Starting overdue item scan');
    const now = new Date();

    await Promise.all([
      this.scanOverdueItems(now),
      this.scanMissedDeadlines(now),
      this.scanUnacknowledgedMeetings(now),
      this.scanMissedPreReads(now),
      this.scanMissedCloseouts(now),
    ]);

    this.logger.log('Overdue scan complete');
  }

  // ── OVERDUE trigger: commitments & action items past due ──

  private async scanOverdueItems(now: Date) {
    const overdueCommitments = await this.prisma.commitment.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: now },
        escalationRuleId: { not: null },
      },
    });

    for (const commitment of overdueCommitments) {
      await this.prisma.commitment.update({
        where: { id: commitment.id },
        data: { status: 'OVERDUE' },
      });

      if (commitment.escalationRuleId) {
        await this.escalationQueue.add('execute-escalation', {
          userId: commitment.userId,
          targetId: commitment.id,
          targetType: 'COMMITMENT',
          ruleId: commitment.escalationRuleId,
          stepOrder: 0,
          retryCount: 0,
        });
      }
    }

    const overdueActions = await this.prisma.actionItem.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: now },
        escalationRuleId: { not: null },
      },
    });

    for (const action of overdueActions) {
      await this.prisma.actionItem.update({
        where: { id: action.id },
        data: { status: 'OVERDUE' },
      });

      if (action.escalationRuleId) {
        await this.escalationQueue.add('execute-escalation', {
          userId: action.userId,
          targetId: action.id,
          targetType: 'ACTION_ITEM',
          ruleId: action.escalationRuleId,
          stepOrder: 0,
          retryCount: 0,
        });
      }
    }

    // Notify affected users
    const affectedUserIds = new Set([
      ...overdueCommitments.map((c) => c.userId),
      ...overdueActions.map((a) => a.userId),
    ]);

    for (const userId of affectedUserIds) {
      const userCommitments = overdueCommitments.filter((c) => c.userId === userId).length;
      const userActions = overdueActions.filter((a) => a.userId === userId).length;

      if (userCommitments > 0 || userActions > 0) {
        await this.notificationQueue.add('send-notification', {
          userId,
          channel: 'IN_APP',
          priority: 'HIGH',
          title: 'Overdue items detected',
          message: `${userCommitments} commitment(s) and ${userActions} action item(s) are now overdue with escalation rules.`,
        });
      }
    }

    this.logger.log(
      `Overdue scan: ${overdueCommitments.length} commitments, ${overdueActions.length} action items`,
    );
  }

  // ── MISSED_DEADLINE trigger: items that just crossed their due date (within last scan interval) ──

  private async scanMissedDeadlines(now: Date) {
    const deadlineRules = await this.prisma.escalationRule.findMany({
      where: { triggerType: 'MISSED_DEADLINE', isActive: true },
    });

    if (deadlineRules.length === 0) return;

    // Look for items that crossed their deadline since the last scan (1 hour window)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const [missedCommitments, missedActionItems] = await Promise.all([
      this.prisma.commitment.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { gte: oneHourAgo, lt: now },
          escalationRuleId: null, // Not already assigned an OVERDUE rule
        },
      }),
      this.prisma.actionItem.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { gte: oneHourAgo, lt: now },
          escalationRuleId: null,
        },
      }),
    ]);

    let triggered = 0;

    for (const commitment of missedCommitments) {
      const rule = deadlineRules.find((r) => r.userId === commitment.userId);
      if (!rule) continue;

      // Check if already escalated for this commitment
      const existing = await this.prisma.escalationLog.findFirst({
        where: {
          escalationRuleId: rule.id,
          commitmentId: commitment.id,
          escalationStatus: { in: ['SENT', 'PENDING', 'DELIVERED'] },
        },
      });
      if (existing) continue;

      await this.prisma.commitment.update({
        where: { id: commitment.id },
        data: { status: 'OVERDUE' },
      });

      await this.escalationQueue.add('execute-escalation', {
        userId: commitment.userId,
        targetId: commitment.id,
        targetType: 'COMMITMENT',
        ruleId: rule.id,
        stepOrder: 0,
        retryCount: 0,
      });
      triggered++;
    }

    for (const actionItem of missedActionItems) {
      const rule = deadlineRules.find((r) => r.userId === actionItem.userId);
      if (!rule) continue;

      const existing = await this.prisma.escalationLog.findFirst({
        where: {
          escalationRuleId: rule.id,
          actionItemId: actionItem.id,
          escalationStatus: { in: ['SENT', 'PENDING', 'DELIVERED'] },
        },
      });
      if (existing) continue;

      await this.prisma.actionItem.update({
        where: { id: actionItem.id },
        data: { status: 'OVERDUE' },
      });

      await this.escalationQueue.add('execute-escalation', {
        userId: actionItem.userId,
        targetId: actionItem.id,
        targetType: 'ACTION_ITEM',
        ruleId: rule.id,
        stepOrder: 0,
        retryCount: 0,
      });
      triggered++;
    }

    if (triggered > 0) {
      this.logger.log(`Missed-deadline scan: triggered ${triggered} escalation(s)`);
    }
  }

  // ── NO_ACKNOWLEDGMENT trigger: meetings past 24h without participant acknowledgment ──

  private async scanUnacknowledgedMeetings(now: Date) {
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find scheduled meetings where participants haven't acknowledged within 24h of scheduling
    const meetings = await this.prisma.meeting.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledStartTime: { gt: now }, // still upcoming
        createdAt: { lt: twentyFourHoursAgo }, // created more than 24h ago
      },
      include: {
        participants: {
          where: { hasAcknowledged: false },
          include: { contact: true },
        },
      },
    });

    // Find escalation rules for NO_ACKNOWLEDGMENT trigger
    const ackRules = await this.prisma.escalationRule.findMany({
      where: { triggerType: 'NO_ACKNOWLEDGMENT', isActive: true },
    });

    if (ackRules.length === 0) return;

    let triggered = 0;
    for (const meeting of meetings) {
      const unacknowledged = meeting.participants.filter((p) => !p.hasAcknowledged);
      if (unacknowledged.length === 0) continue;

      // Use the first matching rule for this user
      const rule = ackRules.find((r) => r.userId === meeting.userId);
      if (!rule) continue;

      // Check if already escalated for this meeting
      const existing = await this.prisma.escalationLog.findFirst({
        where: {
          escalationRuleId: rule.id,
          userId: meeting.userId,
          targetType: 'ACKNOWLEDGMENT',
          escalationStatus: { in: ['SENT', 'PENDING', 'DELIVERED'] },
        },
      });
      if (existing) continue;

      await this.escalationQueue.add('execute-escalation', {
        userId: meeting.userId,
        targetId: meeting.id,
        targetType: 'ACKNOWLEDGMENT',
        ruleId: rule.id,
        stepOrder: 0,
        retryCount: 0,
      });
      triggered++;
    }

    if (triggered > 0) {
      this.logger.log(`No-acknowledgment scan: triggered ${triggered} escalation(s)`);
    }
  }

  // ── MISSED_PRE_READ trigger: meetings past pre-read deadline without distribution ──

  private async scanMissedPreReads(now: Date) {
    // Find meetings with a pre-read deadline that's passed without distribution
    const meetings = await this.prisma.meeting.findMany({
      where: {
        status: { in: ['SCHEDULED', 'PREP_SENT'] },
        preReadDeadline: { lt: now },
        preReadDistributedAt: null,
        scheduledStartTime: { gt: now }, // still upcoming
      },
    });

    const preReadRules = await this.prisma.escalationRule.findMany({
      where: { triggerType: 'MISSED_PRE_READ', isActive: true },
    });

    if (preReadRules.length === 0) return;

    let triggered = 0;
    for (const meeting of meetings) {
      const rule = preReadRules.find((r) => r.userId === meeting.userId);
      if (!rule) continue;

      // Check if already escalated for this meeting
      const existing = await this.prisma.escalationLog.findFirst({
        where: {
          escalationRuleId: rule.id,
          userId: meeting.userId,
          targetType: 'MEETING_PREP',
          escalationStatus: { in: ['SENT', 'PENDING', 'DELIVERED'] },
        },
      });
      if (existing) continue;

      await this.escalationQueue.add('execute-escalation', {
        userId: meeting.userId,
        targetId: meeting.id,
        targetType: 'MEETING_PREP',
        ruleId: rule.id,
        stepOrder: 0,
        retryCount: 0,
      });
      triggered++;
    }

    if (triggered > 0) {
      this.logger.log(`Missed pre-read scan: triggered ${triggered} escalation(s)`);
    }
  }

  // ── NIGHTLY_CLOSEOUT trigger: users who haven't completed daily closeout ──

  private async scanMissedCloseouts(now: Date) {
    // Only run after 10 PM (22:00) — allow users time to close out
    const hour = now.getUTCHours();
    if (hour < 22) return;

    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const closeoutRules = await this.prisma.escalationRule.findMany({
      where: { triggerType: 'NIGHTLY_CLOSEOUT', isActive: true },
    });

    if (closeoutRules.length === 0) return;

    let triggered = 0;
    for (const rule of closeoutRules) {
      // Check if user has completed closeout today
      const closeout = await this.prisma.dailyCloseout.findFirst({
        where: {
          userId: rule.userId,
          date: { gte: todayStart },
          isCompleted: true,
        },
      });

      if (closeout) continue; // Already completed

      // Check if already escalated today
      const existing = await this.prisma.escalationLog.findFirst({
        where: {
          escalationRuleId: rule.id,
          userId: rule.userId,
          sentAt: { gte: todayStart },
          escalationStatus: { in: ['SENT', 'PENDING', 'DELIVERED'] },
        },
      });
      if (existing) continue;

      await this.escalationQueue.add('execute-escalation', {
        userId: rule.userId,
        targetId: rule.userId, // target is the user themselves
        targetType: 'COMMITMENT', // use COMMITMENT as generic target
        ruleId: rule.id,
        stepOrder: 0,
        retryCount: 0,
      });

      await this.notificationQueue.add('send-notification', {
        userId: rule.userId,
        channel: 'IN_APP',
        priority: 'HIGH',
        title: 'Daily closeout reminder',
        message: 'You haven\'t completed your daily closeout yet. Complete it to maintain your streak.',
      });

      triggered++;
    }

    if (triggered > 0) {
      this.logger.log(`Nightly closeout scan: triggered ${triggered} escalation(s)`);
    }
  }
}
