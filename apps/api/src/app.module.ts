import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { QueueModule } from './queue/queue.module';
import { UsersModule } from './users/users.module';
import { ContactTiersModule } from './contact-tiers/contact-tiers.module';
import { ContactsModule } from './contacts/contacts.module';
import { CalendarModule } from './calendar/calendar.module';
import { MeetingsModule } from './meetings/meetings.module';
import { ActionItemsModule } from './action-items/action-items.module';
import { AgreementsModule } from './agreements/agreements.module';
import { CommitmentsModule } from './commitments/commitments.module';
import { DailyCloseoutModule } from './daily-closeout/daily-closeout.module';
import { EscalationModule } from './escalation/escalation.module';
import { AccountabilityModule } from './accountability/accountability.module';
import { BriefingsModule } from './briefings/briefings.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FocusModesModule } from './focus-modes/focus-modes.module';
import { AiEaModule } from './ai-ea/ai-ea.module';
import { SearchModule } from './search/search.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    QueueModule,
    UsersModule,
    ContactTiersModule,
    ContactsModule,
    CalendarModule,
    MeetingsModule,
    ActionItemsModule,
    AgreementsModule,
    CommitmentsModule,
    DailyCloseoutModule,
    EscalationModule,
    AccountabilityModule,
    BriefingsModule,
    NotificationsModule,
    FocusModesModule,
    AiEaModule,
    SearchModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
