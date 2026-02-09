import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';
import { DelegateCommitmentDto } from './dto/delegate-commitment.dto';
import { CommitmentQueryDto } from './dto/commitment-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CommitmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCommitmentDto) {
    return this.prisma.commitment.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        ownerId: dto.ownerId,
        ownerType: dto.ownerType as any,
        dueDate: new Date(dto.dueDate),
        priority: (dto.priority || 'MEDIUM') as any,
        meetingId: dto.meetingId,
        affectsScore: dto.affectsScore ?? true,
        escalationRuleId: dto.escalationRuleId,
      },
    });
  }

  async findAll(userId: string, query: CommitmentQueryDto) {
    const where: Prisma.CommitmentWhereInput = { userId };
    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;

    const [data, total] = await Promise.all([
      this.prisma.commitment.findMany({
        where,
        include: { meeting: true, escalationRule: true },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: query.sortBy
          ? { [query.sortBy]: query.sortOrder }
          : { dueDate: 'asc' },
      }),
      this.prisma.commitment.count({ where }),
    ]);

    return { data, total };
  }

  async findOne(userId: string, id: string) {
    const commitment = await this.prisma.commitment.findFirst({
      where: { id, userId },
      include: { meeting: true, escalationRule: true, escalationLogs: true },
    });
    if (!commitment) throw new NotFoundException('Commitment not found');
    return commitment;
  }

  async update(userId: string, id: string, dto: UpdateCommitmentDto) {
    await this.findOne(userId, id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.dueDate) data.dueDate = new Date(dto.dueDate);

    return this.prisma.commitment.update({ where: { id }, data: data as any });
  }

  async complete(userId: string, id: string) {
    const commitment = await this.findOne(userId, id);
    if (['COMPLETED', 'DELEGATED'].includes(commitment.status)) {
      throw new BadRequestException('Commitment is already completed or delegated');
    }
    return this.prisma.commitment.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async reschedule(userId: string, id: string, newDueDate: string) {
    const commitment = await this.findOne(userId, id);
    if (['COMPLETED', 'DELEGATED'].includes(commitment.status)) {
      throw new BadRequestException('Cannot reschedule a completed or delegated commitment');
    }
    return this.prisma.commitment.update({
      where: { id },
      data: {
        status: 'RESCHEDULED',
        dueDate: new Date(newDueDate),
        rescheduleCount: { increment: 1 },
      },
    });
  }

  async delegate(userId: string, id: string, dto: DelegateCommitmentDto) {
    const commitment = await this.findOne(userId, id);

    // Upward delegation protection: block delegation back to original delegator
    if (commitment.isDelegated && commitment.delegatedToId === dto.delegateToId) {
      throw new BadRequestException('Cannot delegate back to the original delegator');
    }

    // Recursive delegation chain detection: prevent cycles
    await this.detectDelegationCycle(commitment.id, dto.delegateToId);

    return this.prisma.commitment.update({
      where: { id },
      data: {
        status: 'DELEGATED',
        isDelegated: true,
        delegatedToId: dto.delegateToId,
        delegatedAt: new Date(),
        delegatorRetainsAccountability: dto.retainAccountability ?? true,
        delegationReason: dto.reason,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.commitment.delete({ where: { id } });
  }

  /**
   * Detect delegation cycles by walking the chain of delegated commitments.
   * Prevents A→B→C→A circular delegation patterns.
   */
  private async detectDelegationCycle(commitmentId: string, proposedDelegateeId: string) {
    const visited = new Set<string>();
    visited.add(commitmentId);

    let currentOwnerId: string | null = proposedDelegateeId;
    const MAX_DEPTH = 10;
    let depth = 0;

    while (currentOwnerId && depth < MAX_DEPTH) {
      const delegatedCommitment: { id: string; delegatedToId: string | null } | null =
        await this.prisma.commitment.findFirst({
          where: {
            isDelegated: true,
            ownerId: currentOwnerId,
            delegatedToId: { not: null },
          },
          select: { id: true, delegatedToId: true },
        });

      if (!delegatedCommitment) break;

      if (visited.has(delegatedCommitment.id)) {
        throw new BadRequestException(
          'Delegation would create a circular chain. This commitment traces back to the proposed delegatee.',
        );
      }

      visited.add(delegatedCommitment.id);
      currentOwnerId = delegatedCommitment.delegatedToId;
      depth++;
    }
  }
}
