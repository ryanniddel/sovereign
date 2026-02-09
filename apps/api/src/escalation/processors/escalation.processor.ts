import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EscalationService } from '../escalation.service';
import { OverdueScannerService } from './overdue-scanner.service';

@Processor('escalation')
export class EscalationProcessor extends WorkerHost {
  private readonly logger = new Logger(EscalationProcessor.name);

  constructor(
    private readonly escalationService: EscalationService,
    private readonly overdueScannerService: OverdueScannerService,
  ) {
    super();
  }

  async process(job: Job) {
    try {
      switch (job.name) {
        case 'execute-escalation':
          return this.handleExecuteEscalation(job);
        case 'overdue-scan':
          return this.handleOverdueScan();
        default:
          this.logger.warn(`Unknown job name: ${job.name}`);
      }
    } catch (error) {
      this.logger.error(`Escalation job "${job.name}" failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  private async handleExecuteEscalation(job: Job) {
    const { userId, targetId, targetType, ruleId, retryCount } = job.data;
    this.logger.log(
      `Executing escalation for ${targetType} ${targetId} (retry ${retryCount || 0})`,
    );

    await this.escalationService.executeStep(
      userId,
      targetId,
      targetType,
      ruleId,
      retryCount || 0,
    );

    this.logger.log(`Escalation step processed for ${targetType} ${targetId}`);
  }

  private async handleOverdueScan() {
    this.logger.log('Starting overdue item scan');
    await this.overdueScannerService.runScan();
    this.logger.log('Overdue scan complete');
  }
}
