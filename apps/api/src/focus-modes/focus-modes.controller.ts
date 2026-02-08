import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { FocusModesService } from './focus-modes.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { CreateFocusModeDto } from './dto/create-focus-mode.dto';
import { UpdateFocusModeDto } from './dto/update-focus-mode.dto';
import { RequestOverrideDto, ResolveOverrideDto } from './dto/override-focus-mode.dto';
import { FocusModeSessionQueryDto } from './dto/focus-mode-session-query.dto';
import { wrapResponse, wrapPaginatedResponse } from '../common';

@Controller('focus-modes')
export class FocusModesController {
  constructor(
    private readonly focusModesService: FocusModesService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  // ── CRUD ──

  @Post()
  async create(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CreateFocusModeDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.create(userId, dto);
    return wrapResponse(mode);
  }

  @Get()
  async findAll(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const modes = await this.focusModesService.findAll(userId);
    return wrapResponse(modes);
  }

  // ── Static routes (before :id) ──

  @Get('active')
  async getActive(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.getActive(userId);
    return wrapResponse(mode);
  }

  @Get('active/digest')
  async getSuppressedDigest(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const digest = await this.focusModesService.getSuppressedDigest(userId);
    return wrapResponse(digest);
  }

  @Get('analytics')
  async getAnalytics(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('days') days?: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const analytics = await this.focusModesService.getAnalytics(userId, days ? parseInt(days, 10) : 30);
    return wrapResponse(analytics);
  }

  @Get('sessions')
  async getSessions(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: FocusModeSessionQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const { data, total } = await this.focusModesService.getSessions(userId, query);
    return wrapPaginatedResponse(data, total, query.page, query.pageSize);
  }

  @Get('overrides/pending')
  async getPendingOverrides(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const overrides = await this.focusModesService.getPendingOverrides(userId);
    return wrapResponse(overrides);
  }

  @Post('seed-defaults')
  async seedDefaults(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const modes = await this.focusModesService.seedDefaults(userId);
    return wrapResponse(modes);
  }

  @Post('resolve-override')
  async resolveOverride(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: ResolveOverrideDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.focusModesService.resolveOverride(userId, dto.overrideCode, dto.resolverEmail);
    return wrapResponse(result);
  }

  @Post('check-triggers')
  async checkTriggers(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const [calendarResults, scheduleResults] = await Promise.all([
      this.focusModesService.checkCalendarTriggers(userId),
      this.focusModesService.checkScheduledTriggers(userId),
    ]);
    return wrapResponse({ calendarResults, scheduleResults });
  }

  // ── Param routes ──

  @Get(':id')
  async findOne(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.findOne(userId, id);
    return wrapResponse(mode);
  }

  @Patch(':id')
  async update(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: UpdateFocusModeDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.update(userId, id, dto);
    return wrapResponse(mode);
  }

  @Post(':id/activate')
  async activate(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.activate(userId, id);
    return wrapResponse(mode);
  }

  @Post(':id/deactivate')
  async deactivate(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.deactivate(userId, id);
    return wrapResponse(mode);
  }

  @Post(':id/request-override')
  async requestOverride(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: RequestOverrideDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.focusModesService.requestOverride(userId, id, dto.requesterEmail, dto.reason);
    return wrapResponse(result);
  }

  @Post(':id/reject-override/:overrideId')
  async rejectOverride(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') _id: string,
    @Param('overrideId') overrideId: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.focusModesService.rejectOverride(userId, overrideId);
    return wrapResponse(result);
  }

  @Post(':id/clone')
  async cloneMode(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const mode = await this.focusModesService.cloneMode(userId, id);
    return wrapResponse(mode);
  }

  @Get(':id/sessions')
  async getModeSessionHistory(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Query() query: FocusModeSessionQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const queryWithMode = { ...query, focusModeId: id };
    const { data, total } = await this.focusModesService.getSessions(userId, queryWithMode);
    return wrapPaginatedResponse(data, total, query.page, query.pageSize);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    await this.focusModesService.remove(userId, id);
    return wrapResponse(null, 'Focus mode deleted');
  }
}
