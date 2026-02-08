import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { BriefingsService } from '../briefings.service';
import { PrismaService } from '../../database/prisma.service';
import { QUEUE_NAMES } from '../../queue/queue.module';

@Processor('briefing')
export class BriefingProcessor extends WorkerHost {
  private readonly logger = new Logger(BriefingProcessor.name);

  constructor(
    private readonly briefingsService: BriefingsService,
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name === 'generate-morning-briefing') {
      const { userId, timezone } = job.data;
      this.logger.log(`Generating morning briefing for user ${userId}`);
      const briefing = await this.briefingsService.generateMorningBriefing(userId, timezone);
      await this.sendBriefingNotification(userId, 'Morning Briefing', briefing.deliveryChannel);
    } else if (job.name === 'generate-nightly-review') {
      const { userId, timezone } = job.data;
      this.logger.log(`Generating nightly review for user ${userId}`);
      const briefing = await this.briefingsService.generateNightlyReview(userId, timezone);
      await this.sendBriefingNotification(userId, 'Nightly Review', briefing.deliveryChannel);
    } else if (job.name === 'generate-all-morning-briefings') {
      this.logger.log('Generating morning briefings for all users');
      await this.generateForAllUsers('MORNING');
    } else if (job.name === 'generate-all-nightly-reviews') {
      this.logger.log('Generating nightly reviews for all users');
      await this.generateForAllUsers('NIGHTLY');
    }
  }

  private async generateForAllUsers(type: 'MORNING' | 'NIGHTLY') {
    // Get all users with their preferences
    const users = await this.prisma.user.findMany({
      include: { briefingPreference: true },
    });

    let generated = 0;
    let skipped = 0;

    for (const user of users) {
      const prefs = user.briefingPreference;

      // Skip if user has disabled this briefing type
      if (type === 'MORNING' && prefs && !prefs.morningEnabled) {
        skipped++;
        continue;
      }
      if (type === 'NIGHTLY' && prefs && !prefs.nightlyEnabled) {
        skipped++;
        continue;
      }

      try {
        if (type === 'MORNING') {
          const briefing = await this.briefingsService.generateMorningBriefing(user.id, user.timezone);
          await this.sendBriefingNotification(user.id, 'Morning Briefing', briefing.deliveryChannel);
        } else {
          const briefing = await this.briefingsService.generateNightlyReview(user.id, user.timezone);
          await this.sendBriefingNotification(user.id, 'Nightly Review', briefing.deliveryChannel);
        }
        generated++;
      } catch (error) {
        this.logger.error(`Failed to generate ${type} briefing for user ${user.id}: ${error}`);
      }
    }

    this.logger.log(
      `${type} briefing generation complete: ${generated} generated, ${skipped} skipped`,
    );
  }

  private async sendBriefingNotification(userId: string, title: string, channel: string) {
    await this.notificationQueue.add('send-notification', {
      userId,
      channel: channel === 'IN_APP' ? 'IN_APP' : channel,
      priority: 'MEDIUM',
      title: `Your ${title} is ready`,
      message: `Your ${title.toLowerCase()} has been generated. Tap to review.`,
    });
  }
}
