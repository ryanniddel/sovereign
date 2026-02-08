import { Module } from '@nestjs/common';
import { AccountabilityController } from './accountability.controller';
import { AccountabilityService } from './accountability.service';
import { StreaksService } from './streaks.service';
import { ScoreCalculatorProcessor } from './processors/score-calculator.processor';
import { StreakCheckerProcessor } from './processors/streak-checker.processor';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [AccountabilityController],
  providers: [
    AccountabilityService,
    StreaksService,
    ScoreCalculatorProcessor,
    StreakCheckerProcessor,
  ],
  exports: [AccountabilityService, StreaksService],
})
export class AccountabilityModule {}
