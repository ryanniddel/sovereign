import { Module } from '@nestjs/common';
import { BriefingsController } from './briefings.controller';
import { BriefingsService } from './briefings.service';
import { BriefingProcessor } from './processors/briefing.processor';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [UsersModule, QueueModule],
  controllers: [BriefingsController],
  providers: [BriefingsService, BriefingProcessor],
  exports: [BriefingsService],
})
export class BriefingsModule {}
