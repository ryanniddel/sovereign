import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { QUEUE_NAMES } from '../queue/queue.module';

// Map job names to cron intervals for nextRunAt calculation
const CRON_INTERVALS_MS: Record<string, number> = {
  'hourly-overdue-scan': 60 * 60 * 1000,
  'per-user-briefing-check': 60 * 1000,
  'calendar-sync-dispatch': 60 * 1000,
  'meeting-prep-distribution': 15 * 60 * 1000,
  'acknowledgment-followups': 30 * 60 * 1000,
  'midnight-batch': 24 * 60 * 60 * 1000,
  'relationship-score-decay': 24 * 60 * 60 * 1000,
  'search-index-cleanup': 24 * 60 * 60 * 1000,
  'job-history-cleanup': 24 * 60 * 60 * 1000,
  'meeting-auto-cancel': 5 * 60 * 1000,
  'focus-mode-triggers': 2 * 60 * 1000,
  'focus-mode-override-expiry': 5 * 60 * 1000,
  'notification-digest': 30 * 60 * 1000,
  'scheduler-health-check': 10 * 60 * 1000,
};

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly startedAt = new Date();

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.ESCALATION) private readonly escalationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.BRIEFING) private readonly briefingQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.AI_PROCESSING) private readonly aiProcessingQueue: Queue,
    @InjectQueue(QUEUE_NAMES.SYNC) private readonly syncQueue: Queue,
    @InjectQueue(QUEUE_NAMES.MEETINGS) private readonly meetingsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.FOCUS_MODES) private readonly focusModesQueue: Queue,
  ) {}

  // ════════════════════════════════════════════════════════════════
  // JOB TRACKING WRAPPER
  // ════════════════════════════════════════════════════════════════

  private async trackJob(
    jobName: string,
    queue: string,
    fn: () => Promise<{ itemsProcessed: number; itemsFailed?: number; metadata?: Record<string, unknown> }>,
  ) {
    // Idempotency: skip if the same job is already RUNNING
    const alreadyRunning = await this.prisma.scheduledJobRun.findFirst({
      where: { jobName, status: 'RUNNING' },
    });
    if (alreadyRunning) {
      this.logger.warn(`[${jobName}] skipped — previous run still in progress (started ${alreadyRunning.startedAt.toISOString()})`);
      return;
    }

    const run = await this.prisma.scheduledJobRun.create({
      data: { jobName, queue, status: 'RUNNING' },
    });

    const startTime = Date.now();

    try {
      const result = await fn();
      const durationMs = Date.now() - startTime;

      await this.prisma.scheduledJobRun.update({
        where: { id: run.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          durationMs,
          itemsProcessed: result.itemsProcessed,
          itemsFailed: result.itemsFailed ?? 0,
          metadata: result.metadata ? (result.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
        },
      });

      this.logger.log(
        `[${jobName}] completed in ${durationMs}ms — ${result.itemsProcessed} processed, ${result.itemsFailed ?? 0} failed`,
      );
    } catch (error) {
      const durationMs = Date.now() - startTime;

      await this.prisma.scheduledJobRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          durationMs,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });

      this.logger.error(`[${jobName}] failed after ${durationMs}ms: ${error}`);
    }
  }

  // ════════════════════════════════════════════════════════════════
  // HOURLY: OVERDUE SCAN + ESCALATION TRIGGERS
  // ════════════════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_HOUR)
  async hourlyOverdueScan() {
    await this.trackJob('hourly-overdue-scan', QUEUE_NAMES.ESCALATION, async () => {
      await this.escalationQueue.add('overdue-scan', {});
      await this.aiProcessingQueue.add('detect-overdue', {});
      return { itemsProcessed: 2 };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // PER-USER BRIEFING SCHEDULING (every minute)
  // ════════════════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_MINUTE)
  async perUserBriefingCheck() {
    await this.trackJob('per-user-briefing-check', QUEUE_NAMES.BRIEFING, async () => {
      const users = await this.prisma.user.findMany({
        include: { briefingPreference: true },
      });

      let queued = 0;
      let failed = 0;

      for (const user of users) {
        try {
          const currentHHMM = this.getCurrentHHMM(user.timezone);

          // Morning briefing
          const morningTime = user.briefingPreference?.morningTime ?? user.morningBriefingTime;
          const morningEnabled = user.briefingPreference?.morningEnabled ?? true;

          if (morningEnabled && currentHHMM === morningTime) {
            const todayStart = this.todayInTimezone(user.timezone);
            const existing = await this.prisma.briefing.findFirst({
              where: { userId: user.id, type: 'MORNING', date: todayStart },
            });

            if (!existing) {
              await this.briefingQueue.add('generate-morning-briefing', {
                userId: user.id,
                timezone: user.timezone,
              });
              queued++;
            }
          }

          // Nightly review
          const nightlyTime = user.briefingPreference?.nightlyTime ?? user.nightlyReviewTime;
          const nightlyEnabled = user.briefingPreference?.nightlyEnabled ?? true;

          if (nightlyEnabled && currentHHMM === nightlyTime) {
            const todayStart = this.todayInTimezone(user.timezone);
            const existing = await this.prisma.briefing.findFirst({
              where: { userId: user.id, type: 'NIGHTLY', date: todayStart },
            });

            if (!existing) {
              await this.briefingQueue.add('generate-nightly-review', {
                userId: user.id,
                timezone: user.timezone,
              });
              queued++;
            }
          }
        } catch (error) {
          failed++;
          this.logger.warn(`Briefing check failed for user ${user.id}: ${error instanceof Error ? error.message : error}`);
        }
      }

      return { itemsProcessed: queued, itemsFailed: failed, metadata: { usersChecked: users.length } };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // CALENDAR SYNC DISPATCH (every minute)
  // ════════════════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_MINUTE)
  async calendarSyncDispatch() {
    await this.trackJob('calendar-sync-dispatch', QUEUE_NAMES.SYNC, async () => {
      const now = new Date();

      const dueConfigs = await this.prisma.calendarSyncConfig.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { nextSyncAt: { lte: now } },
            { nextSyncAt: null },
          ],
        },
      });

      for (const config of dueConfigs) {
        await this.syncQueue.add('calendar-sync-execute', {
          syncConfigId: config.id,
          userId: config.userId,
        });

        // Atomic update: only set nextSyncAt if it hasn't been changed by another process
        const nextSync = new Date(now.getTime() + config.syncIntervalMinutes * 60 * 1000);
        await this.prisma.calendarSyncConfig.updateMany({
          where: {
            id: config.id,
            OR: [
              { nextSyncAt: config.nextSyncAt },
              { nextSyncAt: null },
            ],
          },
          data: { nextSyncAt: nextSync },
        });
      }

      return { itemsProcessed: dueConfigs.length };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // MEETING PREP DISTRIBUTION (every 15 minutes)
  // ════════════════════════════════════════════════════════════════

  @Cron('*/15 * * * *')
  async meetingPrepDistribution() {
    await this.trackJob('meeting-prep-distribution', QUEUE_NAMES.MEETINGS, async () => {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in23h45m = new Date(now.getTime() + (24 * 60 - 15) * 60 * 1000);

      // Find meetings starting in ~24h that haven't had prep reminders
      const meetings = await this.prisma.meeting.findMany({
        where: {
          status: { in: ['SCHEDULED', 'QUALIFIED'] },
          scheduledStartTime: { gte: in23h45m, lte: in24h },
        },
        include: { participants: true },
      });

      let queued = 0;
      for (const meeting of meetings) {
        await this.meetingsQueue.add('meeting-prep-reminder', {
          meetingId: meeting.id,
          userId: meeting.userId,
        });

        // If pre-read exists but hasn't been distributed, queue distribution
        if (meeting.preReadUrl && !meeting.preReadDistributedAt) {
          await this.meetingsQueue.add('distribute-meeting-prep', {
            meetingId: meeting.id,
            userId: meeting.userId,
          });
        }
        queued++;
      }

      return { itemsProcessed: queued };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // ACKNOWLEDGMENT FOLLOW-UPS (every 30 minutes)
  // ════════════════════════════════════════════════════════════════

  @Cron('*/30 * * * *')
  async acknowledgmentFollowups() {
    await this.trackJob('acknowledgment-followups', QUEUE_NAMES.MEETINGS, async () => {
      const now = new Date();

      // Find scheduled meetings with unacknowledged participants
      const meetings = await this.prisma.meeting.findMany({
        where: {
          status: { in: ['SCHEDULED', 'PREP_SENT'] },
          scheduledStartTime: { gt: now },
        },
        include: {
          participants: {
            where: { hasAcknowledged: false },
          },
        },
      });

      let queued = 0;
      for (const meeting of meetings) {
        if (meeting.participants.length === 0) continue;

        for (const participant of meeting.participants) {
          const age = now.getTime() - participant.createdAt.getTime();
          const hours = age / (60 * 60 * 1000);

          // 24h reminder
          if (hours >= 24 && hours < 25) {
            await this.meetingsQueue.add('acknowledgment-followup', {
              meetingId: meeting.id,
              participantId: participant.id,
              participantEmail: participant.email,
              userId: meeting.userId,
              followupType: 'REMINDER',
            });
            queued++;
          }

          // 48h final warning
          if (hours >= 48 && hours < 49) {
            await this.meetingsQueue.add('acknowledgment-followup', {
              meetingId: meeting.id,
              participantId: participant.id,
              participantEmail: participant.email,
              userId: meeting.userId,
              followupType: 'FINAL_WARNING',
            });
            queued++;
          }
        }
      }

      return { itemsProcessed: queued };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // MIDNIGHT: DAILY SCORES + STREAKS + RECURRING REVIEW
  // ════════════════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async midnightJobs() {
    await this.trackJob('midnight-batch', QUEUE_NAMES.AI_PROCESSING, async () => {
      await this.aiProcessingQueue.add('calculate-daily-scores', {});
      await this.aiProcessingQueue.add('check-streaks', {});
      await this.aiProcessingQueue.add('recurring-meeting-review', {});
      return { itemsProcessed: 3 };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // 1AM: RELATIONSHIP SCORE DECAY
  // ════════════════════════════════════════════════════════════════

  @Cron('0 1 * * *')
  async relationshipScoreDecay() {
    await this.trackJob('relationship-score-decay', QUEUE_NAMES.AI_PROCESSING, async () => {
      await this.aiProcessingQueue.add('relationship-score-decay', {});
      return { itemsProcessed: 1 };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // 3AM: SEARCH INDEX CLEANUP
  // ════════════════════════════════════════════════════════════════

  @Cron('0 3 * * *')
  async searchIndexCleanup() {
    await this.trackJob('search-index-cleanup', QUEUE_NAMES.AI_PROCESSING, async () => {
      await this.aiProcessingQueue.add('search-index-cleanup', {});
      return { itemsProcessed: 1 };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // 4AM: JOB HISTORY CLEANUP (retain 30 days)
  // ════════════════════════════════════════════════════════════════

  @Cron('0 4 * * *')
  async jobHistoryCleanup() {
    await this.trackJob('job-history-cleanup', 'scheduler', async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count } = await this.prisma.scheduledJobRun.deleteMany({
        where: {
          status: { in: ['COMPLETED', 'FAILED', 'TIMED_OUT'] },
          startedAt: { lt: thirtyDaysAgo },
        },
      });

      return { itemsProcessed: count };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // EVERY 5 MINUTES: MEETING AUTO-CANCEL CHECK
  // ════════════════════════════════════════════════════════════════

  @Cron('*/5 * * * *')
  async autoCancelCheck() {
    await this.trackJob('meeting-auto-cancel', QUEUE_NAMES.AI_PROCESSING, async () => {
      await this.aiProcessingQueue.add('meeting-auto-cancel-check', {});
      return { itemsProcessed: 1 };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // EVERY 2 MINUTES: FOCUS MODE TRIGGERS
  // ════════════════════════════════════════════════════════════════

  @Cron('*/2 * * * *')
  async focusModeTriggerCheck() {
    await this.trackJob('focus-mode-triggers', QUEUE_NAMES.FOCUS_MODES, async () => {
      await this.focusModesQueue.add('focus-mode-check-triggers', {});
      return { itemsProcessed: 1 };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // EVERY 5 MINUTES: FOCUS MODE OVERRIDE EXPIRY
  // ════════════════════════════════════════════════════════════════

  @Cron('*/5 * * * *')
  async focusModeOverrideExpiry() {
    await this.trackJob('focus-mode-override-expiry', QUEUE_NAMES.FOCUS_MODES, async () => {
      await this.focusModesQueue.add('focus-mode-expire-overrides', {});
      return { itemsProcessed: 1 };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // EVERY 30 MINUTES: NOTIFICATION DIGEST
  // ════════════════════════════════════════════════════════════════

  @Cron('*/30 * * * *')
  async notificationDigest() {
    await this.trackJob('notification-digest', QUEUE_NAMES.NOTIFICATION, async () => {
      // Find users who have suppressed notifications (not just any focus mode user)
      const usersWithSuppressed = await this.prisma.notification.groupBy({
        by: ['userId'],
        where: {
          suppressed: true,
          isRead: false,
          isDismissed: false,
        },
        _count: true,
      });

      for (const entry of usersWithSuppressed) {
        await this.notificationQueue.add('send-notification', {
          userId: entry.userId,
          channel: 'IN_APP',
          priority: 'LOW',
          category: 'SYSTEM',
          title: 'Suppressed Notifications Digest',
          message: `You have ${entry._count} notification(s) that were suppressed during focus mode.`,
        });
      }

      return { itemsProcessed: usersWithSuppressed.length };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // EVERY 10 MINUTES: SCHEDULER HEALTH CHECK (stuck job detection)
  // ════════════════════════════════════════════════════════════════

  @Cron('*/10 * * * *')
  async schedulerHealthCheck() {
    await this.trackJob('scheduler-health-check', QUEUE_NAMES.AI_PROCESSING, async () => {
      await this.aiProcessingQueue.add('scheduler-health-check', {});
      return { itemsProcessed: 1 };
    });
  }

  // ════════════════════════════════════════════════════════════════
  // HEALTH & MONITORING
  // ════════════════════════════════════════════════════════════════

  async getHealth() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [recentRuns, failedRuns, stuckJobs] = await Promise.all([
      this.prisma.scheduledJobRun.findMany({
        where: { startedAt: { gte: last24h } },
      }),
      this.prisma.scheduledJobRun.findMany({
        where: { startedAt: { gte: last24h }, status: { in: ['FAILED', 'TIMED_OUT'] } },
        orderBy: { startedAt: 'desc' },
        take: 10,
      }),
      this.prisma.scheduledJobRun.count({
        where: { status: 'RUNNING', startedAt: { lt: new Date(now.getTime() - 10 * 60 * 1000) } },
      }),
    ]);

    const successCount = recentRuns.filter((r) => r.status === 'COMPLETED').length;
    const timedOutCount = recentRuns.filter((r) => r.status === 'TIMED_OUT').length;
    const totalDuration = recentRuns
      .filter((r) => r.durationMs !== null)
      .reduce((sum, r) => sum + (r.durationMs ?? 0), 0);
    const runsWithDuration = recentRuns.filter((r) => r.durationMs !== null).length;

    const successRate = recentRuns.length > 0 ? successCount / recentRuns.length : 1;
    const status = stuckJobs > 0
      ? 'unhealthy'
      : successRate >= 0.95 ? 'healthy' : successRate >= 0.8 ? 'degraded' : 'unhealthy';

    // Build job definitions with last run info
    const jobDefs = await this.getJobDefinitions();

    return {
      status,
      uptime: now.getTime() - this.startedAt.getTime(),
      jobs: jobDefs,
      recentFailures: failedRuns,
      stats: {
        totalRunsLast24h: recentRuns.length,
        successRate: Math.round(successRate * 100) / 100,
        failedLast24h: failedRuns.length,
        timedOutLast24h: timedOutCount,
        stuckJobs,
        averageDurationMs: runsWithDuration > 0 ? Math.round(totalDuration / runsWithDuration) : 0,
      },
    };
  }

  private async getJobDefinitions() {
    const jobNames = [
      { name: 'hourly-overdue-scan', queue: 'escalation', schedule: 'Every hour', description: 'Scans for overdue items and triggers escalations' },
      { name: 'per-user-briefing-check', queue: 'briefing', schedule: 'Every minute', description: 'Checks if any user briefings are due based on their configured time' },
      { name: 'calendar-sync-dispatch', queue: 'sync', schedule: 'Every minute', description: 'Dispatches calendar sync jobs for active sync configs' },
      { name: 'meeting-prep-distribution', queue: 'meetings', schedule: 'Every 15 minutes', description: 'Distributes meeting prep materials 24h before meetings' },
      { name: 'acknowledgment-followups', queue: 'meetings', schedule: 'Every 30 minutes', description: 'Sends follow-ups for unacknowledged meeting invitations' },
      { name: 'midnight-batch', queue: 'ai-processing', schedule: 'Daily at midnight', description: 'Calculates daily scores, checks streaks, reviews recurring meetings' },
      { name: 'relationship-score-decay', queue: 'ai-processing', schedule: 'Daily at 1am', description: 'Applies relationship score decay for inactive contacts' },
      { name: 'search-index-cleanup', queue: 'ai-processing', schedule: 'Daily at 3am', description: 'Cleans up old recent searches' },
      { name: 'job-history-cleanup', queue: 'scheduler', schedule: 'Daily at 4am', description: 'Removes job run history older than 30 days' },
      { name: 'meeting-auto-cancel', queue: 'ai-processing', schedule: 'Every 5 minutes', description: 'Auto-cancels meetings missing pre-reads past deadline' },
      { name: 'focus-mode-triggers', queue: 'focus-modes', schedule: 'Every 2 minutes', description: 'Checks scheduled and calendar triggers for focus mode activation' },
      { name: 'focus-mode-override-expiry', queue: 'focus-modes', schedule: 'Every 5 minutes', description: 'Expires stale focus mode override requests' },
      { name: 'notification-digest', queue: 'notification', schedule: 'Every 30 minutes', description: 'Sends digest of suppressed notifications during focus mode' },
      { name: 'scheduler-health-check', queue: 'ai-processing', schedule: 'Every 10 minutes', description: 'Detects and resolves stuck jobs' },
    ];

    // Get last run for each job
    const lastRuns = await Promise.all(
      jobNames.map((j) =>
        this.prisma.scheduledJobRun.findFirst({
          where: { jobName: j.name },
          orderBy: { startedAt: 'desc' },
        }),
      ),
    );

    return jobNames.map((job, i) => {
      const lastRun = lastRuns[i];
      const intervalMs = CRON_INTERVALS_MS[job.name];
      const nextRunAt = lastRun?.startedAt && intervalMs
        ? new Date(lastRun.startedAt.getTime() + intervalMs)
        : undefined;

      return {
        ...job,
        isEnabled: true,
        lastRunAt: lastRun?.startedAt ?? undefined,
        lastRunStatus: lastRun?.status ?? undefined,
        nextRunAt,
      };
    });
  }

  async getJobHistory(params: {
    jobName?: string;
    status?: string;
    from?: Date;
    to?: Date;
    page: number;
    pageSize: number;
  }) {
    const where: Record<string, unknown> = {};

    if (params.jobName) where.jobName = params.jobName;
    if (params.status) where.status = params.status;
    if (params.from || params.to) {
      where.startedAt = {};
      if (params.from) (where.startedAt as Record<string, unknown>).gte = params.from;
      if (params.to) (where.startedAt as Record<string, unknown>).lte = params.to;
    }

    const [runs, total] = await Promise.all([
      this.prisma.scheduledJobRun.findMany({
        where: where as any,
        orderBy: { startedAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.scheduledJobRun.count({ where: where as any }),
    ]);

    const completed = runs.filter((r) => r.status === 'COMPLETED');
    const failed = runs.filter((r) => r.status === 'FAILED');
    const timedOut = runs.filter((r) => r.status === 'TIMED_OUT');
    const avgDuration = completed.length > 0
      ? completed.reduce((sum, r) => sum + (r.durationMs ?? 0), 0) / completed.length
      : 0;
    const avgItems = completed.length > 0
      ? completed.reduce((sum, r) => sum + r.itemsProcessed, 0) / completed.length
      : 0;

    return {
      runs,
      total,
      stats: {
        successCount: completed.length,
        failureCount: failed.length,
        timedOutCount: timedOut.length,
        averageDurationMs: Math.round(avgDuration),
        averageItemsProcessed: Math.round(avgItems),
      },
    };
  }

  async triggerJob(jobName: string) {
    const jobMap: Record<string, () => Promise<void>> = {
      'hourly-overdue-scan': () => this.hourlyOverdueScan(),
      'per-user-briefing-check': () => this.perUserBriefingCheck(),
      'calendar-sync-dispatch': () => this.calendarSyncDispatch(),
      'meeting-prep-distribution': () => this.meetingPrepDistribution(),
      'acknowledgment-followups': () => this.acknowledgmentFollowups(),
      'midnight-batch': () => this.midnightJobs(),
      'relationship-score-decay': () => this.relationshipScoreDecay(),
      'search-index-cleanup': () => this.searchIndexCleanup(),
      'job-history-cleanup': () => this.jobHistoryCleanup(),
      'meeting-auto-cancel': () => this.autoCancelCheck(),
      'focus-mode-triggers': () => this.focusModeTriggerCheck(),
      'focus-mode-override-expiry': () => this.focusModeOverrideExpiry(),
      'notification-digest': () => this.notificationDigest(),
      'scheduler-health-check': () => this.schedulerHealthCheck(),
    };

    const handler = jobMap[jobName];
    if (!handler) {
      throw new Error(`Unknown job: ${jobName}. Available: ${Object.keys(jobMap).join(', ')}`);
    }

    await handler();
    return { triggered: jobName, at: new Date() };
  }

  // ════════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════════

  /**
   * Get the current HH:MM in the user's timezone using Intl.DateTimeFormat.
   * This properly handles DST transitions.
   */
  private getCurrentHHMM(timezone: string): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    const hour = parts.find((p) => p.type === 'hour')?.value ?? '00';
    const minute = parts.find((p) => p.type === 'minute')?.value ?? '00';

    // Intl may return "24" for midnight in some locales — normalize
    return `${hour === '24' ? '00' : hour}:${minute}`;
  }

  /**
   * Get the start of today in the user's timezone (for dedup checks).
   */
  private todayInTimezone(timezone: string): Date {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone }); // "YYYY-MM-DD"
    return new Date(`${dateStr}T00:00:00`);
  }
}
