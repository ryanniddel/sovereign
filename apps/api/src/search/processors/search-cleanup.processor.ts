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

    // 1. Remove recent searches older than 30 days (single batch query)
    const { count: recentDeleted } = await this.prisma.recentSearch.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    // 2. Trim excess recent searches per user (batch approach)
    // Find users who have more than 50 recent searches
    const usersWithExcess = await this.prisma.$queryRaw<{ user_id: string; cnt: bigint }[]>`
      SELECT user_id, COUNT(*) as cnt
      FROM recent_searches
      GROUP BY user_id
      HAVING COUNT(*) > 50
    `;

    let excessDeleted = 0;
    for (const row of usersWithExcess) {
      const excess = Number(row.cnt) - 50;
      // Find the oldest excess entries and delete them
      const oldest = await this.prisma.recentSearch.findMany({
        where: { userId: row.user_id },
        orderBy: { createdAt: 'asc' },
        take: excess,
        select: { id: true },
      });

      if (oldest.length > 0) {
        const { count } = await this.prisma.recentSearch.deleteMany({
          where: { id: { in: oldest.map((o) => o.id) } },
        });
        excessDeleted += count;
      }
    }

    // 3. Clean up unused saved searches (never used, created more than 90 days ago)
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
