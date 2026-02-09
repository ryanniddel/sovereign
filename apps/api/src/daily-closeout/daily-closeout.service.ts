import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ResolveItemsDto } from './dto/resolve-items.dto';
import { CompleteCloseoutDto } from './dto/complete-closeout.dto';
import { todayInTimezone } from '../common/helpers/date.helper';
import { AccountabilityService } from '../accountability/accountability.service';
import { StreaksService } from '../accountability/streaks.service';
import { StreakType } from '@sovereign/shared';

@Injectable()
export class DailyCloseoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountabilityService: AccountabilityService,
    private readonly streaksService: StreaksService,
  ) {}

  async initiate(userId: string, timezone: string) {
    const today = todayInTimezone(timezone);

    // Mark overdue items before starting
    await this.accountabilityService.detectAndMarkOverdue(userId);

    const [openCommitments, openActionItems] = await Promise.all([
      this.prisma.commitment.count({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
      }),
      this.prisma.actionItem.count({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
      }),
    ]);

    // Use upsert to prevent race condition on duplicate initiation
    return this.prisma.dailyCloseout.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        openItemsAtStart: openCommitments + openActionItems,
        activeAgreementsReviewed: 0,
      },
      update: {},
    });
  }

  async getToday(userId: string, timezone: string) {
    const today = todayInTimezone(timezone);
    const closeout = await this.prisma.dailyCloseout.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (!closeout) throw new NotFoundException('No closeout initiated for today');
    return closeout;
  }

  async getOpenItems(userId: string) {
    const [commitments, actionItems, activeAgreements] = await Promise.all([
      this.prisma.commitment.findMany({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.actionItem.findMany({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.agreement.findMany({
        where: { userId, isActive: true },
        orderBy: { agreedAt: 'desc' },
      }),
    ]);

    return { commitments, actionItems, activeAgreements };
  }

  async resolveItems(userId: string, timezone: string, dto: ResolveItemsDto) {
    const closeout = await this.getToday(userId, timezone);
    let completed = 0;
    let rescheduled = 0;
    let delegated = 0;

    for (const resolution of dto.resolutions) {
      const model = resolution.itemType === 'commitment' ? 'commitment' : 'actionItem';

      // Validate item exists and belongs to user
      const item = await (this.prisma[model] as any).findFirst({
        where: { id: resolution.itemId, userId },
      });
      if (!item) {
        throw new BadRequestException(`Item ${resolution.itemId} not found or does not belong to you`);
      }

      if (resolution.resolution === 'completed') {
        await (this.prisma[model] as any).update({
          where: { id: resolution.itemId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        completed++;
      } else if (resolution.resolution === 'rescheduled') {
        await (this.prisma[model] as any).update({
          where: { id: resolution.itemId },
          data: {
            status: 'RESCHEDULED',
            dueDate: new Date(resolution.newDueDate!),
            rescheduleCount: { increment: 1 },
          },
        });
        rescheduled++;
      } else if (resolution.resolution === 'delegated') {
        await (this.prisma[model] as any).update({
          where: { id: resolution.itemId },
          data: {
            status: 'DELEGATED',
            ownerId: resolution.delegateToId,
            isDelegated: true,
            delegatedToId: resolution.delegateToId,
            delegatedAt: new Date(),
          },
        });
        delegated++;
      }
    }

    return this.prisma.dailyCloseout.update({
      where: { id: closeout.id },
      data: {
        itemsCompleted: { increment: completed },
        itemsRescheduled: { increment: rescheduled },
        itemsDelegated: { increment: delegated },
      },
    });
  }

  async reviewAgreements(userId: string, timezone: string, agreementCount: number) {
    const closeout = await this.getToday(userId, timezone);

    // Validate count against actual active agreements
    const actualCount = await this.prisma.agreement.count({
      where: { userId, isActive: true },
    });
    if (agreementCount > actualCount) {
      throw new BadRequestException(
        `Cannot review ${agreementCount} agreements — only ${actualCount} active agreements exist`,
      );
    }

    return this.prisma.dailyCloseout.update({
      where: { id: closeout.id },
      data: { activeAgreementsReviewed: agreementCount },
    });
  }

  async complete(userId: string, timezone: string, dto: CompleteCloseoutDto) {
    const closeout = await this.getToday(userId, timezone);

    // Hard gate: check for remaining open items
    const { commitments, actionItems } = await this.getOpenItems(userId);
    if (commitments.length + actionItems.length > 0) {
      throw new BadRequestException(
        `Cannot complete closeout: ${commitments.length + actionItems.length} open items remain. Resolve all items first.`,
      );
    }

    // Calculate today's accountability score
    const today = todayInTimezone(timezone);
    const score = await this.accountabilityService.calculateDailyScore(userId, today);

    // Update streaks
    const streaksUpdated: string[] = [];

    // Increment daily closeout streak
    await this.streaksService.incrementStreak(userId, StreakType.DAILY_CLOSEOUT);
    streaksUpdated.push('DAILY_CLOSEOUT');

    // If score is >= 80, increment commitment delivery streak
    if (score.score >= 80) {
      await this.streaksService.incrementStreak(userId, StreakType.COMMITMENT_DELIVERY);
      streaksUpdated.push('COMMITMENT_DELIVERY');
    }

    // If all items were on time (no overdue), increment on-time streak
    if (score.commitmentsMissed === 0 && score.actionItemsMissed === 0) {
      await this.streaksService.incrementStreak(userId, StreakType.ON_TIME);
      streaksUpdated.push('ON_TIME');
    }

    // Build closeout summary
    const completionRate = closeout.openItemsAtStart > 0
      ? Math.round((closeout.itemsCompleted / closeout.openItemsAtStart) * 100)
      : 100;

    const closeoutSummary = {
      openItemsAtStart: closeout.openItemsAtStart,
      itemsCompleted: closeout.itemsCompleted,
      itemsRescheduled: closeout.itemsRescheduled,
      itemsDelegated: closeout.itemsDelegated,
      activeAgreementsReviewed: closeout.activeAgreementsReviewed,
      completionRate,
      scoreAtClose: score.score,
      streaksUpdated,
    };

    return this.prisma.dailyCloseout.update({
      where: { id: closeout.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        reflectionNotes: dto.reflectionNotes,
        scoreAtClose: score.score,
        closeoutSummary: closeoutSummary as any,
      },
    });
  }

  async getHistory(userId: string, limit: number = 30) {
    return this.prisma.dailyCloseout.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }
}
