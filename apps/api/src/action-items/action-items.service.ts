import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateActionItemDto } from './dto/create-action-item.dto';
import { UpdateActionItemDto } from './dto/update-action-item.dto';
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
    await this.findOne(userId, id);
    return this.prisma.actionItem.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async reschedule(userId: string, id: string, newDueDate: string) {
    await this.findOne(userId, id);
    return this.prisma.actionItem.update({
      where: { id },
      data: { status: 'RESCHEDULED', dueDate: new Date(newDueDate) },
    });
  }

  async delegate(userId: string, id: string, delegateToId: string) {
    await this.findOne(userId, id);
    return this.prisma.actionItem.update({
      where: { id },
      data: {
        status: 'DELEGATED',
        ownerId: delegateToId,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.actionItem.delete({ where: { id } });
  }
}
