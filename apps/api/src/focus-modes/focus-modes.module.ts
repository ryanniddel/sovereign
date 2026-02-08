import { Module } from '@nestjs/common';
import { FocusModesController } from './focus-modes.controller';
import { FocusModesService } from './focus-modes.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [FocusModesController],
  providers: [FocusModesService],
  exports: [FocusModesService],
})
export class FocusModesModule {}
