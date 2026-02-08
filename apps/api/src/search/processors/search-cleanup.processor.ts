import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';

@Processor('ai-processing')
export class SearchCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(SearchCleanupProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'search-index-cleanup') return;

    this.logger.log('Processing search index cleanup');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Remove recent searches older than 30 days
    const { count: recentDeleted } = await this.prisma.recentSearch.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    // Keep only the most recent 50 searches per user
    const users = await this.prisma.user.findMany({
      select: { id: true },
    });

    let excessDeleted = 0;

    for (const user of users) {
      const totalSearches = await this.prisma.recentSearch.count({
        where: { userId: user.id },
      });

      if (totalSearches > 50) {
        // Find the 50th most recent search
        const threshold = await this.prisma.recentSearch.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          skip: 50,
          take: 1,
        });

        if (threshold.length > 0) {
          const { count } = await this.prisma.recentSearch.deleteMany({
            where: {
              userId: user.id,
              createdAt: { lte: threshold[0].createdAt },
            },
          });
          excessDeleted += count;
        }
      }
    }

    // Clean up unused saved searches (never used, created more than 90 days ago)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const { count: unusedDeleted } = await this.prisma.savedSearch.deleteMany({
      where: {
        useCount: 0,
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    this.logger.log(
      `Search cleanup complete: ${recentDeleted} old recent searches, ${excessDeleted} excess per-user searches, ${unusedDeleted} unused saved searches removed`,
    );
  }
}
