import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Processor('ai-processing')
export class MeetingAutoCancelProcessor extends WorkerHost {
  private readonly logger = new Logger(MeetingAutoCancelProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'meeting-auto-cancel-check') return;

    this.logger.log('Checking for meetings to auto-cancel (missing pre-reads)');

    const now = new Date();
    const meetings = await this.prisma.meeting.findMany({
      where: {
        status: 'SCHEDULED',
        preReadUrl: null,
        preReadDeadline: { lt: now },
      },
    });

    for (const meeting of meetings) {
      await this.prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: 'AUTO_CANCELLED' },
      });
      this.logger.log(`Auto-cancelled meeting ${meeting.id} - missing pre-read`);
    }
  }
}
