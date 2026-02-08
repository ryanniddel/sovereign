import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ResolveItemsDto } from './dto/resolve-items.dto';
import { CompleteCloseoutDto } from './dto/complete-closeout.dto';
import { todayInTimezone } from '../common/helpers/date.helper';

@Injectable()
export class DailyCloseoutService {
  constructor(private readonly prisma: PrismaService) {}

  async initiate(userId: string, timezone: string) {
    const today = todayInTimezone(timezone);

    const existing = await this.prisma.dailyCloseout.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    if (existing) return existing;

    const [openCommitments, openActionItems] = await Promise.all([
      this.prisma.commitment.count({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
      }),
      this.prisma.actionItem.count({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
      }),
    ]);

    return this.prisma.dailyCloseout.create({
      data: {
        userId,
        date: today,
        openItemsAtStart: openCommitments + openActionItems,
      },
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
    const [commitments, actionItems] = await Promise.all([
      this.prisma.commitment.findMany({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.actionItem.findMany({
        where: { userId, status: { in: ['PENDING', 'IN_PROGRESS', 'OVERDUE'] } },
        orderBy: { dueDate: 'asc' },
      }),
    ]);

    return { commitments, actionItems };
  }

  async resolveItems(userId: string, timezone: string, dto: ResolveItemsDto) {
    const closeout = await this.getToday(userId, timezone);
    let completed = 0;
    let rescheduled = 0;
    let delegated = 0;

    for (const resolution of dto.resolutions) {
      const model = resolution.itemType === 'commitment' ? 'commitment' : 'actionItem';

      if (resolution.resolution === 'completed') {
        await (this.prisma[model] as any).update({
          where: { id: resolution.itemId },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
        completed++;
      } else if (resolution.resolution === 'rescheduled') {
        await (this.prisma[model] as any).update({
          where: { id: resolution.itemId },
          data: { status: 'RESCHEDULED', dueDate: new Date(resolution.newDueDate!) },
        });
        rescheduled++;
      } else if (resolution.resolution === 'delegated') {
        await (this.prisma[model] as any).update({
          where: { id: resolution.itemId },
          data: { status: 'DELEGATED', ownerId: resolution.delegateToId },
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

  async complete(userId: string, timezone: string, dto: CompleteCloseoutDto) {
    const closeout = await this.getToday(userId, timezone);

    // Hard gate: check for remaining open items
    const { commitments, actionItems } = await this.getOpenItems(userId);
    if (commitments.length + actionItems.length > 0) {
      throw new BadRequestException(
        `Cannot complete closeout: ${commitments.length + actionItems.length} open items remain. Resolve all items first.`,
      );
    }

    return this.prisma.dailyCloseout.update({
      where: { id: closeout.id },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        reflectionNotes: dto.reflectionNotes,
      },
    });
  }
}
