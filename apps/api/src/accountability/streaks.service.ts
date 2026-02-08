import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { StreakType } from '@sovereign/shared';

@Injectable()
export class StreaksService {
  constructor(private readonly prisma: PrismaService) {}

  async incrementStreak(userId: string, type: StreakType) {
    const existing = await this.prisma.streak.findUnique({
      where: { userId_type: { userId, type } },
    });

    if (existing) {
      const newCount = existing.currentCount + 1;
      return this.prisma.streak.update({
        where: { id: existing.id },
        data: {
          currentCount: newCount,
          longestCount: Math.max(newCount, existing.longestCount),
          lastActivityAt: new Date(),
          brokenAt: null,
        },
      });
    }

    return this.prisma.streak.create({
      data: {
        userId,
        type,
        currentCount: 1,
        longestCount: 1,
        lastActivityAt: new Date(),
        startedAt: new Date(),
      },
    });
  }

  async breakStreak(userId: string, type: StreakType) {
    const existing = await this.prisma.streak.findUnique({
      where: { userId_type: { userId, type } },
    });

    if (!existing) return null;

    return this.prisma.streak.update({
      where: { id: existing.id },
      data: {
        currentCount: 0,
        brokenAt: new Date(),
        startedAt: new Date(),
      },
    });
  }

  async getUserStreaks(userId: string) {
    return this.prisma.streak.findMany({ where: { userId } });
  }
}
