import { Module } from '@nestjs/common';
import { FocusModesController } from './focus-modes.controller';
import { FocusModesService } from './focus-modes.service';
import { FocusModeProcessor } from './processors/focus-mode.processor';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [UsersModule, QueueModule],
  controllers: [FocusModesController],
  providers: [FocusModesService, FocusModeProcessor],
  exports: [FocusModesService],
})
export class FocusModesModule {}
