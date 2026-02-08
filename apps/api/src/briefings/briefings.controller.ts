import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { BriefingsService } from './briefings.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { BriefingQueryDto } from './dto/briefing-query.dto';
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

  @Get()
  async findAll(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: BriefingQueryDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const briefings = await this.briefingsService.findAll(user.id, query);
    return wrapResponse(briefings);
  }

  @Get('morning/latest')
  async getLatestMorning(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.getLatest(user.id, BriefingType.MORNING);
    return wrapResponse(briefing);
  }

  @Get('nightly/latest')
  async getLatestNightly(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.getLatest(user.id, BriefingType.NIGHTLY);
    return wrapResponse(briefing);
  }

  @Post('morning/generate')
  async generateMorning(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.generateMorningBriefing(user.id, user.timezone);
    return wrapResponse(briefing);
  }

  @Post('nightly/generate')
  async generateNightly(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const briefing = await this.briefingsService.generateNightlyReview(user.id, user.timezone);
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
}
