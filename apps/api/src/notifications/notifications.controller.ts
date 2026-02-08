import { Controller, Get, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { wrapResponse } from '../common';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  @Get('preferences')
  async getPreferences(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const prefs = await this.notificationsService.getPreferences(userId);
    return wrapResponse(prefs);
  }

  @Post('preferences')
  async upsertPreference(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const pref = await this.notificationsService.upsertPreference(userId, dto);
    return wrapResponse(pref);
  }
}
