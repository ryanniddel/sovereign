import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateFocusBlockDto } from './dto/create-focus-block.dto';
import { CalendarViewQueryDto } from './dto/calendar-view-query.dto';
import { DateRangeQueryDto, wrapResponse } from '../common';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUser(currentUser: { auth0Id: string; email: string }) {
    return this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
  }

  @Post('events')
  async createEvent(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateEventDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const event = await this.calendarService.createEvent(user.id, dto);
    return wrapResponse(event);
  }

  @Post('focus-blocks')
  async createFocusBlock(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateFocusBlockDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const block = await this.calendarService.createFocusBlock(user.id, dto);
    return wrapResponse(block);
  }

  @Get('events')
  async findEvents(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: DateRangeQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const events = await this.calendarService.findEventsByDateRange(user.id, query);
    return wrapResponse(events);
  }

  @Get('views/daily')
  async dailyView(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: CalendarViewQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const events = await this.calendarService.getDailyView(user.id, query.date, user.timezone);
    return wrapResponse(events);
  }

  @Get('views/weekly')
  async weeklyView(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: CalendarViewQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const events = await this.calendarService.getWeeklyView(user.id, query.date, user.timezone);
    return wrapResponse(events);
  }

  @Get('views/monthly')
  async monthlyView(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: CalendarViewQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const events = await this.calendarService.getMonthlyView(user.id, query.date, user.timezone);
    return wrapResponse(events);
  }

  @Get('views/quarterly')
  async quarterlyView(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: CalendarViewQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const events = await this.calendarService.getQuarterlyView(user.id, query.date, user.timezone);
    return wrapResponse(events);
  }

  @Get('views/agenda')
  async agendaView(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: CalendarViewQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const events = await this.calendarService.getAgendaView(user.id, query.date, user.timezone);
    return wrapResponse(events);
  }

  @Get('command-center')
  async commandCenter(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const data = await this.calendarService.getCommandCenter(user.id, user.timezone);
    return wrapResponse(data);
  }

  @Get('conflicts')
  async checkConflicts(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('startTime') startTime: string,
    @Query('endTime') endTime: string,
  ) {
    const user = await this.resolveUser(currentUser);
    const result = await this.calendarService.checkConflicts(user.id, startTime, endTime);
    return wrapResponse(result);
  }

  @Get('available-slots')
  async availableSlots(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('date') date: string,
    @Query('durationMinutes') durationMinutes: string,
  ) {
    const user = await this.resolveUser(currentUser);
    const slots = await this.calendarService.findAvailableSlots(
      user.id,
      date,
      parseInt(durationMinutes, 10) || 30,
      user.timezone,
    );
    return wrapResponse(slots);
  }

  @Patch('events/:id')
  async updateEvent(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const event = await this.calendarService.updateEvent(user.id, id, dto);
    return wrapResponse(event);
  }

  @Delete('events/:id')
  async deleteEvent(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const user = await this.resolveUser(currentUser);
    await this.calendarService.deleteEvent(user.id, id);
    return wrapResponse(null, 'Event deleted');
  }
}
