import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';

@Processor('ai-processing')
export class SchedulerHealthProcessor extends WorkerHost {
  private readonly logger = new Logger(SchedulerHealthProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'scheduler-health-check') {
      await this.handleHealthCheck();
    } else if (job.name === 'stale-job-cleanup') {
      await this.handleStaleJobCleanup();
    }
  }

  private async handleHealthCheck() {
    this.logger.log('Running scheduler health check');

    // Find jobs that have been RUNNING for more than 10 minutes (likely stuck)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    const stuckJobs = await this.prisma.scheduledJobRun.findMany({
      where: {
        status: 'RUNNING',
        startedAt: { lt: tenMinutesAgo },
      },
    });

    for (const run of stuckJobs) {
      await this.prisma.scheduledJobRun.update({
        where: { id: run.id },
        data: {
          status: 'TIMED_OUT',
          completedAt: new Date(),
          durationMs: Date.now() - run.startedAt.getTime(),
          errorMessage: 'Job timed out after 10 minutes',
        },
      });

      this.logger.warn(`Marked stuck job as TIMED_OUT: ${run.jobName} (started ${run.startedAt.toISOString()})`);
    }

    this.logger.log(`Health check complete: ${stuckJobs.length} stuck jobs resolved`);
  }

  private async handleStaleJobCleanup() {
    this.logger.log('Cleaning up stale job runs');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count } = await this.prisma.scheduledJobRun.deleteMany({
      where: {
        status: { in: ['COMPLETED', 'FAILED', 'TIMED_OUT'] },
        startedAt: { lt: thirtyDaysAgo },
      },
    });

    this.logger.log(`Cleaned up ${count} stale job runs`);
  }
}
