import { Module } from '@nestjs/common';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingPrepProcessor } from './processors/meeting-prep.processor';
import { MeetingAutoCancelProcessor } from './processors/meeting-auto-cancel.processor';
import { RecurringReviewProcessor } from './processors/recurring-review.processor';
import { AcknowledgmentFollowupProcessor } from './processors/acknowledgment-followup.processor';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queue/queue.module';
import { ContactsModule } from '../contacts/contacts.module';

@Module({
  imports: [UsersModule, QueueModule, ContactsModule],
  controllers: [MeetingsController],
  providers: [
    MeetingsService,
    MeetingPrepProcessor,
    MeetingAutoCancelProcessor,
    RecurringReviewProcessor,
    AcknowledgmentFollowupProcessor,
  ],
  exports: [MeetingsService],
})
export class MeetingsModule {}
