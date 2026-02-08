import { Module } from '@nestjs/common';
import { AccountabilityController } from './accountability.controller';
import { AccountabilityService } from './accountability.service';
import { StreaksService } from './streaks.service';
import { ScoreCalculatorProcessor } from './processors/score-calculator.processor';
import { StreakCheckerProcessor } from './processors/streak-checker.processor';
import { OverdueDetectorProcessor } from './processors/overdue-detector.processor';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [UsersModule, QueueModule],
  controllers: [AccountabilityController],
  providers: [
    AccountabilityService,
    StreaksService,
    ScoreCalculatorProcessor,
    StreakCheckerProcessor,
    OverdueDetectorProcessor,
  ],
  exports: [AccountabilityService, StreaksService],
})
export class AccountabilityModule {}
