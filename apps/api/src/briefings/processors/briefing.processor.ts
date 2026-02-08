import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { BriefingsService } from '../briefings.service';
import { PrismaService } from '../../database/prisma.service';

@Processor('briefing')
export class BriefingProcessor extends WorkerHost {
  private readonly logger = new Logger(BriefingProcessor.name);

  constructor(
    private readonly briefingsService: BriefingsService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'generate-morning-briefing') {
      const { userId, timezone } = job.data;
      this.logger.log(`Generating morning briefing for user ${userId}`);
      await this.briefingsService.generateMorningBriefing(userId, timezone);
    } else if (job.name === 'generate-nightly-review') {
      const { userId, timezone } = job.data;
      this.logger.log(`Generating nightly review for user ${userId}`);
      await this.briefingsService.generateNightlyReview(userId, timezone);
    } else if (job.name === 'generate-all-morning-briefings') {
      this.logger.log('Generating morning briefings for all users');
      const users = await this.prisma.user.findMany();
      for (const user of users) {
        await this.briefingsService.generateMorningBriefing(user.id, user.timezone);
      }
    } else if (job.name === 'generate-all-nightly-reviews') {
      this.logger.log('Generating nightly reviews for all users');
      const users = await this.prisma.user.findMany();
      for (const user of users) {
        await this.briefingsService.generateNightlyReview(user.id, user.timezone);
      }
    }
  }
}
