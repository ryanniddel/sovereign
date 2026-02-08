import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { EscalationService } from '../escalation.service';

@Processor('escalation')
export class EscalationProcessor extends WorkerHost {
  private readonly logger = new Logger(EscalationProcessor.name);

  constructor(private readonly escalationService: EscalationService) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'execute-escalation') return;

    const { userId, targetId, targetType, ruleId, stepOrder, retryCount } = job.data;
    this.logger.log(
      `Executing escalation for ${targetType} ${targetId} (step after ${stepOrder}, retry ${retryCount || 0})`,
    );

    await this.escalationService.executeStep(
      userId,
      targetId,
      targetType,
      ruleId,
      stepOrder || 0,
      retryCount || 0,
    );

    this.logger.log(`Escalation step processed for ${targetType} ${targetId}`);
  }
}
