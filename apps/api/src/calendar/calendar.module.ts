import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarProtectionService } from './calendar-protection.service';
import { CalendarSyncService } from './calendar-sync.service';
import { CalendarSyncProcessor } from './processors/calendar-sync.processor';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queue/queue.module';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [UsersModule, QueueModule, IntegrationsModule],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarProtectionService, CalendarSyncService, CalendarSyncProcessor],
  exports: [CalendarService, CalendarProtectionService, CalendarSyncService],
})
export class CalendarModule {}
