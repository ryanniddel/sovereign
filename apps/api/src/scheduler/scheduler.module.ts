import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { SchedulerHealthProcessor } from './processors/scheduler.processor';
import { SchedulerGuard } from './guards/scheduler.guard';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule, ConfigModule],
  controllers: [SchedulerController],
  providers: [SchedulerService, SchedulerHealthProcessor, SchedulerGuard],
})
export class SchedulerModule {}
