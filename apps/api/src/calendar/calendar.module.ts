import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { CalendarProtectionService } from './calendar-protection.service';
import { CalendarSyncService } from './calendar-sync.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [CalendarController],
  providers: [CalendarService, CalendarProtectionService, CalendarSyncService],
  exports: [CalendarService, CalendarProtectionService, CalendarSyncService],
})
export class CalendarModule {}
