import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';

@Processor('notification')
export class MeetingPrepProcessor extends WorkerHost {
  private readonly logger = new Logger(MeetingPrepProcessor.name);

  async process(job: Job) {
    if (job.name !== 'meeting-prep-reminder') return;

    const { meetingId, userId } = job.data;
    this.logger.log(`Sending meeting prep reminder for meeting ${meetingId}`);
  }
}
