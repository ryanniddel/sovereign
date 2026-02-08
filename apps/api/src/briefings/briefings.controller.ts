import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { BriefingsService } from './briefings.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { BriefingQueryDto } from './dto/briefing-query.dto';
import { BriefingFeedbackDto } from './dto/briefing-feedback.dto';
import { UpdateBriefingPreferenceDto } from './dto/update-briefing-preference.dto';
import { wrapResponse } from '../common';
import { BriefingType } from '@sovereign/shared';

@Controller('briefings')
export class BriefingsController {
  constructor(
    private readonly briefingsService: BriefingsService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUser(currentUser: { auth0Id: string; email: string }) {
    return this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
  }

  // ── List & Query ──

  @Get()
  async findAll(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: BriefingQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const briefings = await this.briefingsService.findAll(user.id, query);
    return wrapResponse(briefings);
  }

  @Get('today')
  async getToday(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const briefings = await this.briefingsService.getToday(user.id, user.timezone);
    return wrapResponse(briefings);
  }

  @Get('engagement')
  async getEngagement(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('days') days?: string,
  ) {
    const user = await this.resolveUser(currentUser);
    const stats = await this.briefingsService.getEngagementStats(user.id, days ? parseInt(days, 10) : 30);
    return wrapResponse(stats);
  }

  // ── Preferences ──

  @Get('preferences')
  async getPreferences(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const prefs = await this.briefingsService.getPreferences(user.id);
    return wrapResponse(prefs);
  }

  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: UpdateBriefingPreferenceDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const prefs = await this.briefingsService.updatePreferences(user.id, dto);
    return wrapResponse(prefs);
  }

  // ── Morning Briefing ──

  @Get('morning/latest')
  async getLatestMorning(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.getLatest(user.id, BriefingType.MORNING);
    return wrapResponse(briefing);
  }

  @Get('morning/:date')
  async getMorningForDate(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('date') date: string,
  ) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.getForDate(user.id, BriefingType.MORNING, date);
    return wrapResponse(briefing);
  }

  @Post('morning/generate')
  async generateMorning(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.generateMorningBriefing(user.id, user.timezone);
    return wrapResponse(briefing);
  }

  // ── Nightly Review ──

  @Get('nightly/latest')
  async getLatestNightly(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.getLatest(user.id, BriefingType.NIGHTLY);
    return wrapResponse(briefing);
  }

  @Get('nightly/:date')
  async getNightlyForDate(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('date') date: string,
  ) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.getForDate(user.id, BriefingType.NIGHTLY, date);
    return wrapResponse(briefing);
  }

  @Post('nightly/generate')
  async generateNightly(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.generateNightlyReview(user.id, user.timezone);
    return wrapResponse(briefing);
  }

  // ── Actions ──

  @Post(':id/read')
  async markRead(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.markRead(user.id, id);
    return wrapResponse(briefing);
  }

  @Post(':id/complete')
  async complete(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.completeBriefing(user.id, id);
    return wrapResponse(briefing);
  }

  @Post(':id/feedback')
  async submitFeedback(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
    @Body() dto: BriefingFeedbackDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.submitFeedback(user.id, id, dto.rating, dto.notes);
    return wrapResponse(briefing);
  }
}
