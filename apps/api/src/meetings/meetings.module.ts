import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingPrepProcessor } from './processors/meeting-prep.processor';
import { MeetingAutoCancelProcessor } from './processors/meeting-auto-cancel.processor';
import { RecurringReviewProcessor } from './processors/recurring-review.processor';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [MeetingsController],
  providers: [
    MeetingsService,
    MeetingPrepProcessor,
    MeetingAutoCancelProcessor,
    RecurringReviewProcessor,
  ],
  exports: [MeetingsService],
})
export class MeetingsModule {}
