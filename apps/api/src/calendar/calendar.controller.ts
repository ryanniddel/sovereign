import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarProtectionService } from './calendar-protection.service';
import { CalendarSyncService } from './calendar-sync.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CreateFocusBlockDto } from './dto/create-focus-block.dto';
import { CalendarViewQueryDto } from './dto/calendar-view-query.dto';
import { ConflictCheckDto } from './dto/conflict-check.dto';
import { CreateProtectionRuleDto } from './dto/create-protection-rule.dto';
import { UpdateProtectionRuleDto } from './dto/update-protection-rule.dto';
import { CreateSyncConfigDto } from './dto/create-sync-config.dto';
import { UpdateSyncConfigDto } from './dto/update-sync-config.dto';
import { DateRangeQueryDto, wrapResponse } from '../common';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly protectionService: CalendarProtectionService,
    private readonly syncService: CalendarSyncService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUser(currentUser: { auth0Id: string; email: string }) {
    return this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
  }

  // ════════════════════════════════════════════════════════════════
  // EVENT CRUD
  // ════════════════════════════════════════════════════════════════

  @Post('events')
  async createEvent(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateEventDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const event = await this.calendarService.createEvent(user.id, dto);
    return wrapResponse(event);
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

  @Get('events/:id')
  async findOneEvent(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const user = await this.resolveUser(currentUser);
    const event = await this.calendarService.findOne(user.id, id);
    return wrapResponse(event);
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

  // ════════════════════════════════════════════════════════════════
  // FOCUS BLOCKS
  // ════════════════════════════════════════════════════════════════

  @Post('focus-blocks')
  async createFocusBlock(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateFocusBlockDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const block = await this.calendarService.createFocusBlock(user.id, dto);
    return wrapResponse(block);
  }

  // ════════════════════════════════════════════════════════════════
  // NESTED VIEW ENDPOINTS
  // ════════════════════════════════════════════════════════════════

  @Get('views/daily')
  async dailyView(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: CalendarViewQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const view = await this.calendarService.getDailyView(user.id, query.date, user.timezone);
    return wrapResponse(view);
  }

  @Get('views/weekly')
  async weeklyView(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: CalendarViewQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const view = await this.calendarService.getWeeklyView(user.id, query.date, user.timezone);
    return wrapResponse(view);
  }

  @Get('views/monthly')
  async monthlyView(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: CalendarViewQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const view = await this.calendarService.getMonthlyView(user.id, query.date, user.timezone);
    return wrapResponse(view);
  }

  @Get('views/quarterly')
  async quarterlyView(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: CalendarViewQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const view = await this.calendarService.getQuarterlyView(user.id, query.date, user.timezone);
    return wrapResponse(view);
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

  // ════════════════════════════════════════════════════════════════
  // COMMAND CENTER & AVAILABILITY
  // ════════════════════════════════════════════════════════════════

  @Get('command-center')
  async commandCenter(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const data = await this.calendarService.getCommandCenter(user.id, user.timezone);
    return wrapResponse(data);
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

  // ════════════════════════════════════════════════════════════════
  // CONFLICT DETECTION
  // ════════════════════════════════════════════════════════════════

  @Get('conflicts')
  async checkConflicts(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: ConflictCheckDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const result = await this.calendarService.checkConflicts(
      user.id,
      query.startTime,
      query.endTime,
      query.excludeEventId,
    );
    return wrapResponse(result);
  }

  // ════════════════════════════════════════════════════════════════
  // PROTECTION RULES
  // ════════════════════════════════════════════════════════════════

  @Post('protection-rules')
  async createProtectionRule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateProtectionRuleDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const rule = await this.protectionService.create(user.id, dto);
    return wrapResponse(rule);
  }

  @Get('protection-rules')
  async findProtectionRules(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
  ) {
    const user = await this.resolveUser(currentUser);
    const rules = await this.protectionService.findAll(user.id);
    return wrapResponse(rules);
  }

  @Get('protection-rules/:id')
  async findOneProtectionRule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const user = await this.resolveUser(currentUser);
    const rule = await this.protectionService.findOne(user.id, id);
    return wrapResponse(rule);
  }

  @Patch('protection-rules/:id')
  async updateProtectionRule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateProtectionRuleDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const rule = await this.protectionService.update(user.id, id, dto);
    return wrapResponse(rule);
  }

  @Delete('protection-rules/:id')
  async deleteProtectionRule(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const user = await this.resolveUser(currentUser);
    await this.protectionService.remove(user.id, id);
    return wrapResponse(null, 'Protection rule deleted');
  }

  // ════════════════════════════════════════════════════════════════
  // SYNC CONFIGS
  // ════════════════════════════════════════════════════════════════

  @Post('sync-configs')
  async createSyncConfig(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateSyncConfigDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const config = await this.syncService.createConfig(user.id, dto);
    return wrapResponse(config);
  }

  @Get('sync-configs')
  async findSyncConfigs(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
  ) {
    const user = await this.resolveUser(currentUser);
    const configs = await this.syncService.findAllConfigs(user.id);
    return wrapResponse(configs);
  }

  @Get('sync-configs/:id')
  async findOneSyncConfig(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const user = await this.resolveUser(currentUser);
    const config = await this.syncService.findOneConfig(user.id, id);
    return wrapResponse(config);
  }

  @Patch('sync-configs/:id')
  async updateSyncConfig(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateSyncConfigDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const config = await this.syncService.updateConfig(user.id, id, dto);
    return wrapResponse(config);
  }

  @Delete('sync-configs/:id')
  async deleteSyncConfig(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const user = await this.resolveUser(currentUser);
    await this.syncService.removeConfig(user.id, id);
    return wrapResponse(null, 'Sync config deleted');
  }

  @Get('sync-configs/:id/logs')
  async findSyncLogs(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const user = await this.resolveUser(currentUser);
    await this.syncService.findOneConfig(user.id, id); // ownership check
    const logs = await this.syncService.findSyncLogs(id);
    return wrapResponse(logs);
  }
}
