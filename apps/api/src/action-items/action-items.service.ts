import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
import { DelegateActionItemDto } from './dto/delegate-action-item.dto';
import { ActionItemQueryDto } from './dto/action-item-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActionItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateActionItemDto) {
    return this.prisma.actionItem.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        ownerId: dto.ownerId,
        ownerType: dto.ownerType as any,
        dueDate: new Date(dto.dueDate),
        priority: (dto.priority || 'MEDIUM') as any,
        meetingId: dto.meetingId,
        externalSystem: dto.externalSystem as any,
        externalSystemId: dto.externalSystemId,
        escalationRuleId: dto.escalationRuleId,
      },
    });
  }

  async findAll(userId: string, query: ActionItemQueryDto) {
    const where: Prisma.ActionItemWhereInput = { userId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;

    const [data, total] = await Promise.all([
      this.prisma.actionItem.findMany({
        where,
        include: { meeting: true, escalationRule: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: query.sortBy
          ? { [query.sortBy]: query.sortOrder }
          : { dueDate: 'asc' },
      }),
      this.prisma.actionItem.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(userId: string, id: string) {
    const item = await this.prisma.actionItem.findFirst({
      where: { id, userId },
      include: { meeting: true, escalationRule: true, escalationLogs: true },
    });
    if (!item) throw new NotFoundException('Action item not found');
    return item;
  }

  async update(userId: string, id: string, dto: UpdateActionItemDto) {
    await this.findOne(userId, id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);

    return this.prisma.actionItem.update({ where: { id }, data: data as any });
  }

  async complete(userId: string, id: string) {
    const item = await this.findOne(userId, id);
    if (['COMPLETED', 'DELEGATED'].includes(item.status)) {
      throw new BadRequestException('Action item is already completed or delegated');
    }
    return this.prisma.actionItem.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async reschedule(userId: string, id: string, newDueDate: string) {
    const item = await this.findOne(userId, id);
    if (['COMPLETED', 'DELEGATED'].includes(item.status)) {
      throw new NotFoundException('Cannot reschedule a completed or delegated action item');
    }
    return this.prisma.actionItem.update({
      where: { id },
      data: {
        status: 'RESCHEDULED',
        dueDate: new Date(newDueDate),
        rescheduleCount: { increment: 1 },
      },
    });
  }

  async delegate(userId: string, id: string, dto: DelegateActionItemDto) {
    const item = await this.findOne(userId, id);

    // Upward delegation protection: block delegation back to original delegator
    if (item.isDelegated && item.delegatedToId === dto.delegateToId) {
      throw new BadRequestException('Cannot delegate back to the original delegator');
    }

    // Recursive delegation chain detection: prevent cycles
    await this.detectDelegationCycle(item.id, dto.delegateToId);

    return this.prisma.actionItem.update({
      where: { id },
      data: {
        status: 'DELEGATED',
        isDelegated: true,
        delegatedToId: dto.delegateToId,
        delegatedAt: new Date(),
        delegatorRetainsAccountability: dto.retainAccountability ?? true,
        delegationReason: dto.reason,
        ownerId: dto.delegateToId,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.actionItem.delete({ where: { id } });
  }

  /**
   * Detect delegation cycles by walking the chain of delegated items.
   * If the proposed delegatee has previously delegated items back toward
   * the current item's owner chain, throw to prevent circular delegation.
   */
  private async detectDelegationCycle(itemId: string, proposedDelegateeId: string) {
    const visited = new Set<string>();
    visited.add(itemId);

    // Walk action items delegated TO the proposed delegatee that they in turn delegated
    let currentOwnerId: string | null = proposedDelegateeId;
    const MAX_DEPTH = 10;
    let depth = 0;

    while (currentOwnerId && depth < MAX_DEPTH) {
      // Find items that were delegated BY the currentOwnerId
      const delegatedItem: { id: string; delegatedToId: string | null } | null =
        await this.prisma.actionItem.findFirst({
          where: {
            isDelegated: true,
            ownerId: currentOwnerId,
            delegatedToId: { not: null },
          },
          select: { id: true, delegatedToId: true },
        });

      if (!delegatedItem) break;

      if (visited.has(delegatedItem.id)) {
        throw new BadRequestException(
          'Delegation would create a circular chain. This item traces back to the proposed delegatee.',
        );
      }

      visited.add(delegatedItem.id);
      currentOwnerId = delegatedItem.delegatedToId;
      depth++;
    }
  }
}
