import { Module } from '@nestjs/common';
import { DailyCloseoutController } from './daily-closeout.controller';
import { DailyCloseoutService } from './daily-closeout.service';
import { UsersModule } from '../users/users.module';
import { AccountabilityModule } from '../accountability/accountability.module';

@Module({
  imports: [UsersModule, AccountabilityModule],
  controllers: [DailyCloseoutController],
  providers: [DailyCloseoutService],
  exports: [DailyCloseoutService],
})
export class DailyCloseoutModule {}
