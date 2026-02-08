import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../queue/queue.module';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.ESCALATION) private readonly escalationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.BRIEFING) private readonly briefingQueue: Queue,
    @InjectQueue(QUEUE_NAMES.AI_PROCESSING) private readonly aiProcessingQueue: Queue,
  ) {}

  // Every hour: overdue scan + trigger escalations
  @Cron(CronExpression.EVERY_HOUR)
  async hourlyOverdueScan() {
    this.logger.log('Hourly: triggering overdue scan');
    await this.escalationQueue.add('overdue-scan', {});
    await this.aiProcessingQueue.add('detect-overdue', {});
  }

  // 6am daily: morning briefing generation
  @Cron('0 6 * * *')
  async morningBriefing() {
    this.logger.log('6am: generating morning briefings');
    await this.briefingQueue.add('generate-all-morning-briefings', {});
  }

  // 8pm daily: nightly review generation
  @Cron('0 20 * * *')
  async nightlyReview() {
    this.logger.log('8pm: generating nightly reviews');
    await this.briefingQueue.add('generate-all-nightly-reviews', {});
  }

  // Midnight: daily scores + streak checks + recurring meeting review
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async midnightJobs() {
    this.logger.log('Midnight: running daily jobs');
    await this.aiProcessingQueue.add('calculate-daily-scores', {});
    await this.aiProcessingQueue.add('check-streaks', {});
    await this.aiProcessingQueue.add('recurring-meeting-review', {});
  }

  // Every 5 minutes: auto-cancel check for meetings missing pre-reads
  @Cron('*/5 * * * *')
  async autoCancelCheck() {
    this.logger.log('5min: checking for meetings to auto-cancel');
    await this.aiProcessingQueue.add('meeting-auto-cancel-check', {});
  }
}
