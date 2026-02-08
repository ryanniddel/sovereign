import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { CreateEscalationRuleDto } from './dto/create-escalation-rule.dto';
import { UpdateEscalationRuleDto } from './dto/update-escalation-rule.dto';
import { EscalationQueryDto } from './dto/escalation-query.dto';
import { EscalationTargetType } from '@sovereign/shared';
import { Prisma } from '@prisma/client';
import { QUEUE_NAMES } from '../queue/queue.module';

@Injectable()
export class EscalationService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.ESCALATION) private readonly escalationQueue: Queue,
  ) {}

  async createRule(userId: string, dto: CreateEscalationRuleDto) {
    return this.prisma.escalationRule.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType as any,
        steps: dto.steps as any,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAllRules(userId: string, query: EscalationQueryDto) {
    const where: Prisma.EscalationRuleWhereInput = { userId };
    if (query.triggerType) where.triggerType = query.triggerType;

    const [data, total] = await Promise.all([
      this.prisma.escalationRule.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.escalationRule.count({ where }),
    ]);

    return { data, total };
  }

  async findOneRule(userId: string, id: string) {
    const rule = await this.prisma.escalationRule.findFirst({
      where: { id, userId },
      include: { escalationLogs: { take: 20, orderBy: { sentAt: 'desc' } } },
    });
    if (!rule) throw new NotFoundException('Escalation rule not found');
    return rule;
  }

  async updateRule(userId: string, id: string, dto: UpdateEscalationRuleDto) {
    await this.findOneRule(userId, id);
    return this.prisma.escalationRule.update({
      where: { id },
      data: dto as any,
    });
  }

  async deleteRule(userId: string, id: string) {
    await this.findOneRule(userId, id);
    return this.prisma.escalationRule.delete({ where: { id } });
  }

  async getLogs(userId: string) {
    return this.prisma.escalationLog.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
      take: 50,
      include: { escalationRule: true, contact: true },
    });
  }

  async triggerEscalation(
    userId: string,
    targetId: string,
    targetType: EscalationTargetType,
    ruleId: string,
  ) {
    await this.escalationQueue.add('execute-escalation', {
      userId,
      targetId,
      targetType,
      ruleId,
    });
  }
}
