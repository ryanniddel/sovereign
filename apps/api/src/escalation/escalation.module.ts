import { Module } from '@nestjs/common';
import { EscalationController } from './escalation.controller';
import { EscalationService } from './escalation.service';
import { EscalationProcessor } from './processors/escalation.processor';
import { OverdueScannerService } from './processors/overdue-scanner.service';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [UsersModule, QueueModule],
  controllers: [EscalationController],
  providers: [EscalationService, EscalationProcessor, OverdueScannerService],
  exports: [EscalationService],
})
export class EscalationModule {}
