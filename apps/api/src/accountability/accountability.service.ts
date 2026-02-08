import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StreaksService } from './streaks.service';
import { AccountabilityQueryDto } from './dto/accountability-query.dto';

@Injectable()
export class AccountabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly streaksService: StreaksService,
  ) {}

  async getScores(userId: string, query: AccountabilityQueryDto) {
    const where: Record<string, unknown> = { userId };
    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) (where.date as Record<string, unknown>).gte = new Date(query.startDate);
      if (query.endDate) (where.date as Record<string, unknown>).lte = new Date(query.endDate);
    }

    return this.prisma.accountabilityScore.findMany({
      where: where as any,
      orderBy: { date: 'desc' },
    });
  }

  async getLatestScore(userId: string) {
    return this.prisma.accountabilityScore.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async calculateDailyScore(userId: string, date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [commitmentsMade, commitmentsDelivered, commitmentsMissed] = await Promise.all([
      this.prisma.commitment.count({
        where: { userId, createdAt: { gte: dayStart, lte: dayEnd } },
      }),
      this.prisma.commitment.count({
        where: { userId, status: 'COMPLETED', completedAt: { gte: dayStart, lte: dayEnd } },
      }),
      this.prisma.commitment.count({
        where: { userId, status: 'OVERDUE', dueDate: { gte: dayStart, lte: dayEnd } },
      }),
    ]);

    const total = commitmentsDelivered + commitmentsMissed;
    const onTimeRate = total > 0 ? commitmentsDelivered / total : 1;
    const score = Math.round(onTimeRate * 100);

    return this.prisma.accountabilityScore.upsert({
      where: { userId_date: { userId, date: dayStart } },
      create: {
        userId,
        date: dayStart,
        score,
        commitmentsMade,
        commitmentsDelivered,
        commitmentsMissed,
        onTimeRate: Math.round(onTimeRate * 100) / 100,
      },
      update: {
        score,
        commitmentsMade,
        commitmentsDelivered,
        commitmentsMissed,
        onTimeRate: Math.round(onTimeRate * 100) / 100,
      },
    });
  }

  async getStreaks(userId: string) {
    return this.streaksService.getUserStreaks(userId);
  }

  async getDashboard(userId: string) {
    const [latestScore, streaks] = await Promise.all([
      this.getLatestScore(userId),
      this.streaksService.getUserStreaks(userId),
    ]);

    return { latestScore, streaks };
  }
}
