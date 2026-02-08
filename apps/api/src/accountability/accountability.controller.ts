import { Controller, Get, Post, Query } from '@nestjs/common';
import { AccountabilityService } from './accountability.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { AccountabilityQueryDto } from './dto/accountability-query.dto';
import { AccountabilityTrendQueryDto, TrendPeriod } from './dto/accountability-trend-query.dto';
import { wrapResponse } from '../common';

@Controller('accountability')
export class AccountabilityController {
  constructor(
    private readonly accountabilityService: AccountabilityService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  @Get('scores')
  async getScores(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: AccountabilityQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const scores = await this.accountabilityService.getScores(userId, query);
    return wrapResponse(scores);
  }

  @Get('streaks')
  async getStreaks(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const streaks = await this.accountabilityService.getStreaks(userId);
    return wrapResponse(streaks);
  }

  @Get('dashboard')
  async getDashboard(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const dashboard = await this.accountabilityService.getDashboard(userId);
    return wrapResponse(dashboard);
  }

  @Get('trends')
  async getTrends(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: AccountabilityTrendQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const daysMap: Record<string, number> = {
      [TrendPeriod.SEVEN_DAY]: 7,
      [TrendPeriod.THIRTY_DAY]: 30,
      [TrendPeriod.NINETY_DAY]: 90,
    };
    const days = daysMap[query.period || TrendPeriod.THIRTY_DAY] || 30;
    const trend = await this.accountabilityService.getTrend(userId, days);
    return wrapResponse(trend);
  }

  @Get('items')
  async getUnifiedItems(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('filter') filter?: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const items = await this.accountabilityService.getUnifiedItems(userId, filter);
    return wrapResponse(items);
  }

  @Post('detect-overdue')
  async detectOverdue(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.accountabilityService.detectAndMarkOverdue(userId);
    return wrapResponse(result);
  }
}
