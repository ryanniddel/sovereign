import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MeetingsService } from '../meetings.service';
import { QUEUE_NAMES } from '../../queue/queue.module';

@Processor('ai-processing')
export class RecurringReviewProcessor extends WorkerHost {
  private readonly logger = new Logger(RecurringReviewProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly meetingsService: MeetingsService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly notificationQueue: Queue,
  ) {
    super();
  }

  async process(job: Job) {
    if (job.name !== 'recurring-meeting-review') return;

    this.logger.log('Running recurring meeting governance review');

    // Find all users with recurring meetings due for review
    const dueForReview = await this.prisma.meeting.findMany({
      where: {
        isRecurring: true,
        nextReviewDate: { lte: new Date() },
      },
      select: { userId: true },
      distinct: ['userId'],
    });

    for (const { userId } of dueForReview) {
      try {
        const reviews = await this.meetingsService.getRecurringReviews(userId);

        for (const review of reviews) {
          if (review.recommendation === 'CANCEL' || review.recommendation === 'REVIEW') {
            await this.notificationQueue.add('send-notification', {
              userId,
              channel: 'IN_APP',
              priority: review.recommendation === 'CANCEL' ? 'HIGH' : 'MEDIUM',
              title: `Recurring meeting review: ${review.title}`,
              message: `Recommendation: ${review.recommendation} — ${review.reasonForRecommendation}`,
            });

            this.logger.log(
              `Recurring meeting ${review.meetingId}: ${review.recommendation} — ${review.reasonForRecommendation}`,
            );
          }
        }

        // Update next review date for processed meetings
        await this.prisma.meeting.updateMany({
          where: {
            userId,
            isRecurring: true,
            nextReviewDate: { lte: new Date() },
          },
          data: {
            nextReviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        });
      } catch (error) {
        this.logger.error(`Failed to review recurring meetings for user ${userId}`, error);
      }
    }
  }
}
