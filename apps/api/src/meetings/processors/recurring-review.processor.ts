import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Processor('ai-processing')
export class RecurringReviewProcessor extends WorkerHost {
  private readonly logger = new Logger(RecurringReviewProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'recurring-meeting-review') return;

    this.logger.log('Reviewing recurring meetings due for governance review');

    const now = new Date();
    const meetings = await this.prisma.meeting.findMany({
      where: {
        isRecurring: true,
        nextReviewDate: { lte: now },
      },
      include: { participants: true },
    });

    for (const meeting of meetings) {
      this.logger.log(`Recurring meeting ${meeting.id} is due for review`);
    }
  }
}
