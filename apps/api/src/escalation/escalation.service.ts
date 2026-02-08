import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service';
import { CreateEscalationRuleDto } from './dto/create-escalation-rule.dto';
import { UpdateEscalationRuleDto } from './dto/update-escalation-rule.dto';
import { EscalationQueryDto } from './dto/escalation-query.dto';
import { EscalationLogQueryDto } from './dto/escalation-log-query.dto';
import { EscalationTargetType } from '@sovereign/shared';
import { Prisma } from '@prisma/client';
import { QUEUE_NAMES } from '../queue/queue.module';

@Injectable()
export class EscalationService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.ESCALATION) private readonly escalationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {}

  // ── Rule CRUD ──

  async createRule(userId: string, dto: CreateEscalationRuleDto) {
    return this.prisma.escalationRule.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType as any,
        steps: dto.steps as any,
        isActive: dto.isActive ?? true,
        maxRetries: dto.maxRetries ?? 3,
        cooldownMinutes: dto.cooldownMinutes ?? 60,
        stopOnResponse: dto.stopOnResponse ?? true,
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
        include: {
          _count: { select: { escalationLogs: true } },
        },
      }),
      this.prisma.escalationRule.count({ where }),
    ]);

    return { data, total };
  }

  async findOneRule(userId: string, id: string) {
    const rule = await this.prisma.escalationRule.findFirst({
      where: { id, userId },
      include: {
        escalationLogs: { take: 20, orderBy: { sentAt: 'desc' } },
        _count: { select: { escalationLogs: true, commitments: true, actionItems: true } },
      },
    });
    if (!rule) throw new NotFoundException('Escalation rule not found');
    return rule;
  }

  async updateRule(userId: string, id: string, dto: UpdateEscalationRuleDto) {
    await this.findOneRule(userId, id);
    return this.prisma.escalationRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.triggerType !== undefined && { triggerType: dto.triggerType as any }),
        ...(dto.steps !== undefined && { steps: dto.steps as any }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.maxRetries !== undefined && { maxRetries: dto.maxRetries }),
        ...(dto.cooldownMinutes !== undefined && { cooldownMinutes: dto.cooldownMinutes }),
        ...(dto.stopOnResponse !== undefined && { stopOnResponse: dto.stopOnResponse }),
      },
    });
  }

  async deleteRule(userId: string, id: string) {
    await this.findOneRule(userId, id);
    return this.prisma.escalationRule.delete({ where: { id } });
  }

  async cloneRule(userId: string, id: string) {
    const rule = await this.findOneRule(userId, id);
    return this.prisma.escalationRule.create({
      data: {
        userId,
        name: `${rule.name} (copy)`,
        description: rule.description,
        triggerType: rule.triggerType,
        steps: rule.steps as any,
        isActive: false,
        maxRetries: rule.maxRetries,
        cooldownMinutes: rule.cooldownMinutes,
        stopOnResponse: rule.stopOnResponse,
      },
    });
  }

  // ── Log Queries ──

  async getLogs(userId: string, query: EscalationLogQueryDto) {
    const where: Prisma.EscalationLogWhereInput = { userId };

    if (query.targetType) where.targetType = query.targetType;
    if (query.channel) where.channel = query.channel;
    if (query.status) where.escalationStatus = query.status;
    if (query.ruleId) where.escalationRuleId = query.ruleId;

    if (query.from || query.to) {
      where.sentAt = {};
      if (query.from) (where.sentAt as any).gte = new Date(query.from);
      if (query.to) (where.sentAt as any).lte = new Date(query.to);
    }

    const [data, total] = await Promise.all([
      this.prisma.escalationLog.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { sentAt: 'desc' },
        include: {
          escalationRule: { select: { name: true, triggerType: true } },
          contact: { select: { name: true, email: true } },
          commitment: { select: { title: true, status: true } },
          actionItem: { select: { title: true, status: true } },
        },
      }),
      this.prisma.escalationLog.count({ where }),
    ]);

    return { data, total };
  }

  // ── Trigger & Execute ──

  async triggerEscalation(
    userId: string,
    targetId: string,
    targetType: EscalationTargetType,
    ruleId: string,
  ) {
    const rule = await this.prisma.escalationRule.findFirst({
      where: { id: ruleId, userId, isActive: true },
    });
    if (!rule) throw new NotFoundException('Active escalation rule not found');

    // Check if there's already a pending chain for this target
    const existingPending = await this.prisma.escalationLog.findFirst({
      where: {
        escalationRuleId: ruleId,
        escalationStatus: 'PENDING',
        ...(targetType === 'COMMITMENT' ? { commitmentId: targetId } : { actionItemId: targetId }),
      },
    });

    if (existingPending) {
      throw new BadRequestException('An escalation chain is already active for this target');
    }

    await this.escalationQueue.add('execute-escalation', {
      userId,
      targetId,
      targetType,
      ruleId,
      stepOrder: 0,
      retryCount: 0,
    });
  }

  async executeStep(
    userId: string,
    targetId: string,
    targetType: string,
    ruleId: string,
    requestedStep: number,
    retryCount: number,
  ) {
    const rule = await this.prisma.escalationRule.findUnique({ where: { id: ruleId } });
    if (!rule || !rule.isActive) return;

    const steps = rule.steps as any[];

    // Determine current escalation level from the target
    let currentLevel = 0;
    let targetTitle = '';
    if (targetType === 'COMMITMENT') {
      const commitment = await this.prisma.commitment.findUnique({ where: { id: targetId } });
      if (!commitment || commitment.status === 'COMPLETED') return;
      currentLevel = commitment.currentEscalationLevel;
      targetTitle = commitment.title;
    } else if (targetType === 'ACTION_ITEM') {
      const actionItem = await this.prisma.actionItem.findUnique({ where: { id: targetId } });
      if (!actionItem || actionItem.status === 'COMPLETED') return;
      currentLevel = actionItem.currentEscalationLevel;
      targetTitle = actionItem.title;
    }

    // Check if a response was received and rule says to stop
    if (rule.stopOnResponse) {
      const hasResponse = await this.prisma.escalationLog.findFirst({
        where: {
          escalationRuleId: ruleId,
          escalationStatus: 'RESPONDED',
          ...(targetType === 'COMMITMENT' ? { commitmentId: targetId } : { actionItemId: targetId }),
        },
      });
      if (hasResponse) return;
    }

    // Check for cancelled/paused status
    const cancelledOrPaused = await this.prisma.escalationLog.findFirst({
      where: {
        escalationRuleId: ruleId,
        escalationStatus: { in: ['CANCELLED', 'PAUSED'] },
        ...(targetType === 'COMMITMENT' ? { commitmentId: targetId } : { actionItemId: targetId }),
      },
      orderBy: { sentAt: 'desc' },
    });
    if (cancelledOrPaused) return;

    const nextStep = steps.find((s: any) => s.stepOrder === currentLevel + 1);
    if (!nextStep) {
      // No more steps — check if we should retry
      if (retryCount < rule.maxRetries) {
        // Reset to step 1 after cooldown
        await this.escalationQueue.add(
          'execute-escalation',
          { userId, targetId, targetType, ruleId, stepOrder: 0, retryCount: retryCount + 1 },
          { delay: rule.cooldownMinutes * 60 * 1000 },
        );
      }
      return;
    }

    // Resolve recipient
    const recipientEmail = await this.resolveRecipient(userId, nextStep);

    // Generate message content based on tone
    const messageContent = this.generateMessage(nextStep, targetTitle, currentLevel + 1, steps.length);

    // Create escalation log
    const logData: Record<string, unknown> = {
      userId,
      escalationRuleId: ruleId,
      stepOrder: nextStep.stepOrder,
      targetType,
      recipientEmail,
      recipientContactId: nextStep.recipientContactId || null,
      channel: nextStep.channel,
      tone: nextStep.tone,
      messageContent,
      escalationStatus: 'SENT',
      sentAt: new Date(),
    };

    if (targetType === 'COMMITMENT') logData.commitmentId = targetId;
    if (targetType === 'ACTION_ITEM') logData.actionItemId = targetId;

    await this.prisma.escalationLog.create({ data: logData as any });

    // Update current escalation level on the target
    if (targetType === 'COMMITMENT') {
      await this.prisma.commitment.update({
        where: { id: targetId },
        data: { currentEscalationLevel: nextStep.stepOrder, lastEscalatedAt: new Date() },
      });
    } else if (targetType === 'ACTION_ITEM') {
      await this.prisma.actionItem.update({
        where: { id: targetId },
        data: { currentEscalationLevel: nextStep.stepOrder, lastEscalatedAt: new Date() },
      });
    }

    // Send notification
    await this.notificationQueue.add('send-notification', {
      userId,
      channel: nextStep.channel,
      priority: nextStep.tone === 'FINAL' || nextStep.tone === 'URGENT' ? 'CRITICAL' : 'HIGH',
      title: `Escalation: ${targetTitle}`,
      message: messageContent,
      recipientEmail,
    });

    // Schedule next step if available (with contact tier delay applied)
    const followingStep = steps.find((s: any) => s.stepOrder === nextStep.stepOrder + 1);
    if (followingStep) {
      const tierDelay = await this.getContactTierDelay(userId, recipientEmail);
      const totalDelayMs = (followingStep.delayMinutes + tierDelay) * 60 * 1000;
      await this.escalationQueue.add(
        'execute-escalation',
        { userId, targetId, targetType, ruleId, stepOrder: nextStep.stepOrder, retryCount },
        { delay: totalDelayMs },
      );
    } else if (retryCount < rule.maxRetries) {
      // After last step, schedule retry cycle after cooldown
      await this.escalationQueue.add(
        'execute-escalation',
        { userId, targetId, targetType, ruleId, stepOrder: 0, retryCount: retryCount + 1 },
        { delay: rule.cooldownMinutes * 60 * 1000 },
      );
    }
  }

  // ── Pause / Resume / Cancel ──

  async pauseEscalation(userId: string, targetId: string, targetType: string) {
    await this.prisma.escalationLog.create({
      data: {
        userId,
        escalationRuleId: await this.findRuleForTarget(userId, targetId, targetType),
        stepOrder: 0,
        targetType: targetType as any,
        ...(targetType === 'COMMITMENT' ? { commitmentId: targetId } : { actionItemId: targetId }),
        recipientEmail: 'system',
        channel: 'IN_APP' as any,
        tone: 'PROFESSIONAL' as any,
        messageContent: 'Escalation paused by user',
        escalationStatus: 'PAUSED',
        sentAt: new Date(),
      },
    });
  }

  async resumeEscalation(userId: string, targetId: string, targetType: string) {
    // Remove the paused marker by finding the paused log
    const pausedLog = await this.prisma.escalationLog.findFirst({
      where: {
        userId,
        escalationStatus: 'PAUSED',
        ...(targetType === 'COMMITMENT' ? { commitmentId: targetId } : { actionItemId: targetId }),
      },
      orderBy: { sentAt: 'desc' },
    });

    if (!pausedLog) throw new NotFoundException('No paused escalation found for this target');

    // Mark the pause log as cancelled (clearing the pause)
    await this.prisma.escalationLog.update({
      where: { id: pausedLog.id },
      data: { escalationStatus: 'CANCELLED' },
    });

    // Re-trigger from current level
    const ruleId = pausedLog.escalationRuleId;
    await this.escalationQueue.add('execute-escalation', {
      userId,
      targetId,
      targetType,
      ruleId,
      stepOrder: 0,
      retryCount: 0,
    });
  }

  async cancelEscalation(userId: string, targetId: string, targetType: string) {
    const ruleId = await this.findRuleForTarget(userId, targetId, targetType);

    await this.prisma.escalationLog.create({
      data: {
        userId,
        escalationRuleId: ruleId,
        stepOrder: 0,
        targetType: targetType as any,
        ...(targetType === 'COMMITMENT' ? { commitmentId: targetId } : { actionItemId: targetId }),
        recipientEmail: 'system',
        channel: 'IN_APP' as any,
        tone: 'PROFESSIONAL' as any,
        messageContent: 'Escalation cancelled by user',
        escalationStatus: 'CANCELLED',
        sentAt: new Date(),
      },
    });

    // Reset escalation level on target
    if (targetType === 'COMMITMENT') {
      await this.prisma.commitment.update({
        where: { id: targetId },
        data: { currentEscalationLevel: 0 },
      });
    } else if (targetType === 'ACTION_ITEM') {
      await this.prisma.actionItem.update({
        where: { id: targetId },
        data: { currentEscalationLevel: 0 },
      });
    }
  }

  // ── Response Recording ──

  async recordResponse(userId: string, logId: string, responseContent?: string) {
    const log = await this.prisma.escalationLog.findFirst({
      where: { id: logId, userId },
    });
    if (!log) throw new NotFoundException('Escalation log not found');

    return this.prisma.escalationLog.update({
      where: { id: logId },
      data: {
        escalationStatus: 'RESPONDED',
        responseReceivedAt: new Date(),
        responseContent: responseContent || 'Response received',
      },
    });
  }

  // ── Active Escalation Chains ──

  async getActiveChains(userId: string) {
    // Find all items with escalation levels > 0 that aren't completed
    const [activeCommitments, activeActionItems] = await Promise.all([
      this.prisma.commitment.findMany({
        where: {
          userId,
          currentEscalationLevel: { gt: 0 },
          status: { notIn: ['COMPLETED', 'DELEGATED'] },
          escalationRuleId: { not: null },
        },
        include: { escalationRule: true },
      }),
      this.prisma.actionItem.findMany({
        where: {
          userId,
          currentEscalationLevel: { gt: 0 },
          status: { notIn: ['COMPLETED', 'DELEGATED'] },
          escalationRuleId: { not: null },
        },
        include: { escalationRule: true },
      }),
    ]);

    const chains = [];

    for (const c of activeCommitments) {
      const steps = (c.escalationRule?.steps as any[]) || [];
      const latestLog = await this.prisma.escalationLog.findFirst({
        where: { commitmentId: c.id, escalationStatus: { in: ['SENT', 'DELIVERED', 'PENDING'] } },
        orderBy: { sentAt: 'desc' },
      });

      const nextStepAt = this.calculateNextStepAt(steps, c.currentEscalationLevel, c.lastEscalatedAt || c.updatedAt);

      chains.push({
        targetId: c.id,
        targetType: 'COMMITMENT',
        targetTitle: c.title,
        ruleName: c.escalationRule?.name || '',
        ruleId: c.escalationRuleId!,
        currentStep: c.currentEscalationLevel,
        totalSteps: steps.length,
        status: latestLog?.escalationStatus || 'SENT',
        lastEscalatedAt: c.lastEscalatedAt || c.updatedAt,
        nextStepAt,
      });
    }

    for (const a of activeActionItems) {
      const steps = (a.escalationRule?.steps as any[]) || [];
      const latestLog = await this.prisma.escalationLog.findFirst({
        where: { actionItemId: a.id, escalationStatus: { in: ['SENT', 'DELIVERED', 'PENDING'] } },
        orderBy: { sentAt: 'desc' },
      });

      const nextStepAt = this.calculateNextStepAt(steps, a.currentEscalationLevel, a.lastEscalatedAt || a.updatedAt);

      chains.push({
        targetId: a.id,
        targetType: 'ACTION_ITEM',
        targetTitle: a.title,
        ruleName: a.escalationRule?.name || '',
        ruleId: a.escalationRuleId!,
        currentStep: a.currentEscalationLevel,
        totalSteps: steps.length,
        status: latestLog?.escalationStatus || 'SENT',
        lastEscalatedAt: a.lastEscalatedAt || a.updatedAt,
        nextStepAt,
      });
    }

    return chains;
  }

  // ── Analytics ──

  async getAnalytics(userId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.prisma.escalationLog.findMany({
      where: {
        userId,
        sentAt: { gte: since },
        escalationStatus: { notIn: ['CANCELLED', 'PAUSED'] },
      },
    });

    const totalEscalations = logs.length;
    const byChannel: Record<string, number> = {};
    const byTone: Record<string, number> = {};
    const byTargetType: Record<string, number> = {};

    let respondedCount = 0;
    let totalResponseTimeMs = 0;

    for (const log of logs) {
      byChannel[log.channel] = (byChannel[log.channel] || 0) + 1;
      byTone[log.tone] = (byTone[log.tone] || 0) + 1;
      byTargetType[log.targetType] = (byTargetType[log.targetType] || 0) + 1;

      if (log.escalationStatus === 'RESPONDED' && log.responseReceivedAt) {
        respondedCount++;
        totalResponseTimeMs += log.responseReceivedAt.getTime() - log.sentAt.getTime();
      }
    }

    const activeChains = await this.getActiveChains(userId);

    return {
      totalEscalations,
      byChannel,
      byTone,
      byTargetType,
      responseRate: totalEscalations > 0 ? respondedCount / totalEscalations : 0,
      averageResponseTimeMinutes:
        respondedCount > 0 ? Math.round(totalResponseTimeMs / respondedCount / 60000) : 0,
      activeChains: activeChains.length,
      resolvedByResponse: respondedCount,
    };
  }

  // ── Helpers ──

  private async resolveRecipient(userId: string, step: any): Promise<string> {
    // If step specifies a contact, look up their email
    if (step.recipientContactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: step.recipientContactId, userId },
      });
      if (contact) return contact.email;
    }

    // If step specifies an email directly, use it
    if (step.recipientEmail) return step.recipientEmail;

    // Fall back to the user's own email
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user?.email || 'escalation@sovereign.app';
  }

  private generateMessage(step: any, targetTitle: string, currentStep: number, totalSteps: number): string {
    const template = step.messageTemplate;
    if (template) {
      return template
        .replace('{{targetTitle}}', targetTitle)
        .replace('{{step}}', String(currentStep))
        .replace('{{totalSteps}}', String(totalSteps));
    }

    // Auto-generate based on tone
    const toneMessages: Record<string, string> = {
      WARM: `Friendly reminder: "${targetTitle}" needs your attention (step ${currentStep} of ${totalSteps}).`,
      PROFESSIONAL: `Following up on "${targetTitle}" — this item requires action (step ${currentStep}/${totalSteps}).`,
      DIRECT: `Action required: "${targetTitle}" is overdue. Please address immediately (step ${currentStep}/${totalSteps}).`,
      URGENT: `URGENT: "${targetTitle}" has not been addressed. Escalation step ${currentStep} of ${totalSteps}.`,
      FINAL: `FINAL NOTICE: "${targetTitle}" remains unresolved. This is the last escalation (step ${currentStep}/${totalSteps}).`,
    };

    return toneMessages[step.tone] || toneMessages.PROFESSIONAL;
  }

  private calculateNextStepAt(steps: any[], currentLevel: number, lastEscalatedAt: Date): Date | null {
    const nextStep = steps.find((s: any) => s.stepOrder === currentLevel + 1);
    if (!nextStep) return null;
    return new Date(lastEscalatedAt.getTime() + nextStep.delayMinutes * 60 * 1000);
  }

  private async getContactTierDelay(userId: string, recipientEmail: string): Promise<number> {
    const contact = await this.prisma.contact.findFirst({
      where: { userId, email: recipientEmail },
      include: { tier: true },
    });
    return contact?.tier?.escalationDelayMinutes || 0;
  }

  private async findRuleForTarget(userId: string, targetId: string, targetType: string): Promise<string> {
    if (targetType === 'COMMITMENT') {
      const commitment = await this.prisma.commitment.findFirst({
        where: { id: targetId, userId },
      });
      if (commitment?.escalationRuleId) return commitment.escalationRuleId;
    } else if (targetType === 'ACTION_ITEM') {
      const actionItem = await this.prisma.actionItem.findFirst({
        where: { id: targetId, userId },
      });
      if (actionItem?.escalationRuleId) return actionItem.escalationRuleId;
    }

    // Fall back to most recent log
    const log = await this.prisma.escalationLog.findFirst({
      where: {
        userId,
        ...(targetType === 'COMMITMENT' ? { commitmentId: targetId } : { actionItemId: targetId }),
      },
      orderBy: { sentAt: 'desc' },
    });
    if (log) return log.escalationRuleId;

    throw new NotFoundException('No escalation rule found for this target');
  }
}
