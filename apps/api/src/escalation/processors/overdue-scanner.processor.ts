import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QUEUE_NAMES } from '../../queue/queue.module';

@Processor('escalation')
export class OverdueScannerProcessor extends WorkerHost {
  private readonly logger = new Logger(OverdueScannerProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.ESCALATION) private readonly escalationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'overdue-scan') return;

    this.logger.log('Starting overdue item scan');
    const now = new Date();

    // Scan overdue commitments
    const overdueCommitments = await this.prisma.commitment.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: now },
        escalationRuleId: { not: null },
      },
    });

    for (const commitment of overdueCommitments) {
      await this.prisma.commitment.update({
        where: { id: commitment.id },
        data: { status: 'OVERDUE' },
      });

      if (commitment.escalationRuleId) {
        await this.escalationQueue.add('execute-escalation', {
          userId: commitment.userId,
          targetId: commitment.id,
          targetType: 'COMMITMENT',
          ruleId: commitment.escalationRuleId,
        });
      }
    }

    // Scan overdue action items
    const overdueActions = await this.prisma.actionItem.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        dueDate: { lt: now },
        escalationRuleId: { not: null },
      },
    });

    for (const action of overdueActions) {
      await this.prisma.actionItem.update({
        where: { id: action.id },
        data: { status: 'OVERDUE' },
      });

      if (action.escalationRuleId) {
        await this.escalationQueue.add('execute-escalation', {
          userId: action.userId,
          targetId: action.id,
          targetType: 'ACTION_ITEM',
          ruleId: action.escalationRuleId,
        });
      }
    }

    this.logger.log(
      `Overdue scan complete: ${overdueCommitments.length} commitments, ${overdueActions.length} action items`,
    );
  }
}
