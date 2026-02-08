import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { StreaksService } from '../streaks.service';
import { PrismaService } from '../../database/prisma.service';
import { StreakType } from '@sovereign/shared';

@Processor('ai-processing')
export class StreakCheckerProcessor extends WorkerHost {
  private readonly logger = new Logger(StreakCheckerProcessor.name);

  constructor(
    private readonly streaksService: StreaksService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'check-streaks') return;

    this.logger.log('Checking streaks for all users');

    const users = await this.prisma.user.findMany({ select: { id: true } });
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    for (const user of users) {
      // Check daily closeout streak
      const closeout = await this.prisma.dailyCloseout.findFirst({
        where: {
          userId: user.id,
          date: yesterday,
          isCompleted: true,
        },
      });
      if (!closeout) {
        await this.streaksService.breakStreak(user.id, StreakType.DAILY_CLOSEOUT);
      }

      // Check commitment delivery streak
      const overdueCommitments = await this.prisma.commitment.count({
        where: {
          userId: user.id,
          status: 'OVERDUE',
          dueDate: { gte: yesterday, lte: yesterdayEnd },
        },
      });
      if (overdueCommitments > 0) {
        await this.streaksService.breakStreak(user.id, StreakType.COMMITMENT_DELIVERY);
      }
    }

    this.logger.log(`Streak check complete for ${users.length} users`);
  }
}
