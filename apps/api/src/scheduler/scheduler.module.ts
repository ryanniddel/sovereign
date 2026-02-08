import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
