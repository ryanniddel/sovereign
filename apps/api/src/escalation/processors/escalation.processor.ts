import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Processor('escalation')
export class EscalationProcessor extends WorkerHost {
  private readonly logger = new Logger(EscalationProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'execute-escalation') return;

    const { userId, targetId, targetType, ruleId } = job.data;
    this.logger.log(`Executing escalation for ${targetType} ${targetId}`);

    const rule = await this.prisma.escalationRule.findUnique({ where: { id: ruleId } });
    if (!rule || !rule.isActive) return;

    const steps = rule.steps as any[];

    // Determine current level
    let currentLevel = 0;
    if (targetType === 'COMMITMENT') {
      const commitment = await this.prisma.commitment.findUnique({ where: { id: targetId } });
      if (commitment) currentLevel = commitment.currentEscalationLevel;
    } else if (targetType === 'ACTION_ITEM') {
      const actionItem = await this.prisma.actionItem.findUnique({ where: { id: targetId } });
      if (actionItem) currentLevel = actionItem.currentEscalationLevel;
    }

    const nextStep = steps.find((s: any) => s.stepOrder === currentLevel + 1);
    if (!nextStep) {
      this.logger.log('No more escalation steps');
      return;
    }

    // Create escalation log
    const logData: Record<string, unknown> = {
      userId,
      escalationRuleId: ruleId,
      stepOrder: nextStep.stepOrder,
      targetType,
      recipientEmail: 'escalation@sovereign.app',
      channel: nextStep.channel,
      tone: nextStep.tone,
      sentAt: new Date(),
    };

    if (targetType === 'COMMITMENT') logData.commitmentId = targetId;
    if (targetType === 'ACTION_ITEM') logData.actionItemId = targetId;

    await this.prisma.escalationLog.create({ data: logData as any });

    // Update current escalation level
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

    this.logger.log(`Escalation step ${nextStep.stepOrder} executed via ${nextStep.channel}`);
  }
}
