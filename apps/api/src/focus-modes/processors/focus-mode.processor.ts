import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { FocusModesService } from '../focus-modes.service';

@Processor('focus-modes')
export class FocusModeProcessor extends WorkerHost {
  private readonly logger = new Logger(FocusModeProcessor.name);

  constructor(private readonly focusModesService: FocusModesService) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'focus-mode-auto-deactivate') {
      return this.handleAutoDeactivate(job);
    }

    if (job.name === 'focus-mode-check-triggers') {
      return this.handleCheckTriggers(job);
    }

    if (job.name === 'focus-mode-expire-overrides') {
      return this.handleExpireOverrides();
    }
  }

  private async handleAutoDeactivate(job: Job) {
    const { userId, focusModeId, sessionActivatedAt } = job.data;

    try {
      const result = await this.focusModesService.handleAutoDeactivation(
        userId,
        focusModeId,
        sessionActivatedAt,
      );

      if (result) {
        this.logger.log(`Auto-deactivated focus mode ${focusModeId} for user ${userId}`);
      } else {
        this.logger.log(`Skipped auto-deactivation for focus mode ${focusModeId} (no longer active or different session)`);
      }
    } catch (error) {
      this.logger.error(`Failed to auto-deactivate focus mode ${focusModeId}: ${error}`);
    }
  }

  private async handleCheckTriggers(job: Job) {
    const { userId } = job.data;

    try {
      if (userId) {
        // Check triggers for a specific user
        const [calendarResults, scheduleResults] = await Promise.all([
          this.focusModesService.checkCalendarTriggers(userId),
          this.focusModesService.checkScheduledTriggers(userId),
        ]);

        const total = calendarResults.length + scheduleResults.length;
        if (total > 0) {
          this.logger.log(`Trigger check for user ${userId}: ${total} actions taken`);
        }
      } else {
        // Check all users
        const results = await this.focusModesService.checkAllTriggers();
        this.logger.log(`Bulk trigger check: ${results.length} users had changes`);
      }
    } catch (error) {
      this.logger.error(`Failed to check focus mode triggers: ${error}`);
    }
  }

  private async handleExpireOverrides() {
    try {
      const result = await this.focusModesService.expirePendingOverrides();
      if (result.expired > 0) {
        this.logger.log(`Expired ${result.expired} pending override requests`);
      }
    } catch (error) {
      this.logger.error(`Failed to expire override requests: ${error}`);
    }
  }
}
