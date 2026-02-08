import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AccountabilityService } from '../accountability.service';
import { PrismaService } from '../../database/prisma.service';

@Processor('ai-processing')
export class ScoreCalculatorProcessor extends WorkerHost {
  private readonly logger = new Logger(ScoreCalculatorProcessor.name);

  constructor(
    private readonly accountabilityService: AccountabilityService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'calculate-daily-scores') return;

    this.logger.log('Calculating daily accountability scores for all users');

    const users = await this.prisma.user.findMany({ select: { id: true } });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    for (const user of users) {
      await this.accountabilityService.calculateDailyScore(user.id, yesterday);
    }

    this.logger.log(`Scores calculated for ${users.length} users`);
  }
}
