import { Controller, Get, Post, Body } from '@nestjs/common';
import { DailyCloseoutService } from './daily-closeout.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { ResolveItemsDto } from './dto/resolve-items.dto';
import { CompleteCloseoutDto } from './dto/complete-closeout.dto';
import { wrapResponse } from '../common';

@Controller('daily-closeout')
export class DailyCloseoutController {
  constructor(
    private readonly dailyCloseoutService: DailyCloseoutService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUser(currentUser: { auth0Id: string; email: string }) {
    return this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
  }

  @Post('initiate')
  async initiate(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const closeout = await this.dailyCloseoutService.initiate(user.id, user.timezone);
    return wrapResponse(closeout);
  }

  @Get('today')
  async getToday(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const closeout = await this.dailyCloseoutService.getToday(user.id, user.timezone);
    return wrapResponse(closeout);
  }

  @Get('today/open-items')
  async getOpenItems(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const user = await this.resolveUser(currentUser);
    const items = await this.dailyCloseoutService.getOpenItems(user.id);
    return wrapResponse(items);
  }

  @Post('today/resolve')
  async resolveItems(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: ResolveItemsDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const closeout = await this.dailyCloseoutService.resolveItems(user.id, user.timezone, dto);
    return wrapResponse(closeout);
  }

  @Post('today/complete')
  async complete(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: CompleteCloseoutDto,
  ) {
    const user = await this.resolveUser(currentUser);
    const closeout = await this.dailyCloseoutService.complete(user.id, user.timezone, dto);
    return wrapResponse(closeout);
  }
}
