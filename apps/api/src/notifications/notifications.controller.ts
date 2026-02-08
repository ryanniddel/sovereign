import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { wrapResponse, wrapPaginatedResponse } from '../common';

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

  // ── Inbox ──

  @Get('inbox')
  async getInbox(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query() query: NotificationQueryDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const { data, total } = await this.notificationsService.getInbox(userId, query);
    return wrapPaginatedResponse(data, total, query.page, query.pageSize);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const count = await this.notificationsService.getUnreadCount(userId);
    return wrapResponse(count);
  }

  @Get('stats')
  async getStats(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('days') days?: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const stats = await this.notificationsService.getStats(userId, days ? parseInt(days, 10) : 30);
    return wrapResponse(stats);
  }

  // ── Actions ──

  @Post(':id/read')
  async markRead(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const notification = await this.notificationsService.markRead(userId, id);
    return wrapResponse(notification);
  }

  @Post('mark-all-read')
  async markAllRead(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body('category') category?: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.notificationsService.markAllRead(userId, category);
    return wrapResponse(result);
  }

  @Post(':id/dismiss')
  async dismiss(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('id') id: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const notification = await this.notificationsService.dismiss(userId, id);
    return wrapResponse(notification);
  }

  @Post('dismiss-all')
  async dismissAll(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body('category') category?: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.notificationsService.dismissAll(userId, category);
    return wrapResponse(result);
  }

  // ── Send (internal/testing) ──

  @Post('send')
  async send(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: SendNotificationDto,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const notification = await this.notificationsService.createNotification({
      userId,
      title: dto.title,
      message: dto.message,
      channel: dto.channel,
      priority: dto.priority,
    });
    return wrapResponse(notification);
  }

  // ── Preferences ──

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

  @Post('preferences/initialize')
  async initializeDefaults(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const prefs = await this.notificationsService.initializeDefaults(userId);
    return wrapResponse(prefs);
  }

  // ── Cleanup ──

  @Delete('cleanup')
  async cleanup(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Query('days') days?: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.notificationsService.cleanupOld(userId, days ? parseInt(days, 10) : 90);
    return wrapResponse(result);
  }
}
