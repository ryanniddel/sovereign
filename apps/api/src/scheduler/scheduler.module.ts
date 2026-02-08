import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { SchedulerHealthProcessor } from './processors/scheduler.processor';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, SchedulerHealthProcessor],
})
export class SchedulerModule {}
