import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AccountabilityService } from '../accountability.service';
import { PrismaService } from '../../database/prisma.service';
import { QUEUE_NAMES } from '../../queue/queue.module';

@Processor('ai-processing')
export class OverdueDetectorProcessor extends WorkerHost {
  private readonly logger = new Logger(OverdueDetectorProcessor.name);

  constructor(
    private readonly accountabilityService: AccountabilityService,
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.ESCALATION) private readonly escalationQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'detect-overdue') return;

    this.logger.log('Running overdue detection scan');

    const result = await this.accountabilityService.detectAndMarkOverdue();

    if (result.commitmentsMarkedOverdue > 0 || result.actionItemsMarkedOverdue > 0) {
      this.logger.log(
        `Marked overdue: ${result.commitmentsMarkedOverdue} commitments, ${result.actionItemsMarkedOverdue} action items`,
      );

      // Find newly overdue items with escalation rules and trigger escalation
      const overdueWithEscalation = await this.prisma.commitment.findMany({
        where: {
          status: 'OVERDUE',
          escalationRuleId: { not: null },
          currentEscalationLevel: 0,
        },
        select: { id: true, userId: true, escalationRuleId: true, title: true },
      });

      const overdueActionsWithEscalation = await this.prisma.actionItem.findMany({
        where: {
          status: 'OVERDUE',
          escalationRuleId: { not: null },
          currentEscalationLevel: 0,
        },
        select: { id: true, userId: true, escalationRuleId: true, title: true },
      });

      // Queue escalation jobs for items with rules
      for (const item of overdueWithEscalation) {
        await this.escalationQueue.add('execute-escalation', {
          userId: item.userId,
          targetId: item.id,
          targetType: 'COMMITMENT',
          ruleId: item.escalationRuleId,
          stepOrder: 0,
          retryCount: 0,
        });
      }
      for (const item of overdueActionsWithEscalation) {
        await this.escalationQueue.add('execute-escalation', {
          userId: item.userId,
          targetId: item.id,
          targetType: 'ACTION_ITEM',
          ruleId: item.escalationRuleId,
          stepOrder: 0,
          retryCount: 0,
        });
      }

      // Notify users about newly overdue items
      const userIds = new Set([
        ...overdueWithEscalation.map((i) => i.userId),
        ...overdueActionsWithEscalation.map((i) => i.userId),
      ]);

      for (const userId of userIds) {
        await this.notificationQueue.add('send-notification', {
          userId,
          channel: 'IN_APP',
          priority: 'HIGH',
          title: 'Items marked overdue',
          message: `${result.commitmentsMarkedOverdue} commitment(s) and ${result.actionItemsMarkedOverdue} action item(s) are now overdue.`,
        });
      }
    }

    this.logger.log('Overdue detection scan complete');
  }
}
