import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { NimbleCrmService } from './nimble-crm.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from '../users/users.service';
import { wrapResponse } from '../common';

@Controller('nimble-crm')
export class NimbleCrmController {
  constructor(
    private readonly nimbleCrmService: NimbleCrmService,
    private readonly usersService: UsersService,
  ) {}

  private async resolveUserId(currentUser: { auth0Id: string; email: string }) {
    const user = await this.usersService.findOrCreateFromAuth0(currentUser.auth0Id, currentUser.email);
    return user.id;
  }

  @Get('status')
  async getStatus(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const status = await this.nimbleCrmService.getConnectionStatus(userId);
    return wrapResponse(status);
  }

  @Post('connect')
  async connect(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: { apiKey: string; accountId?: string },
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.nimbleCrmService.connect(userId, dto);
    return wrapResponse(result);
  }

  @Delete('disconnect')
  async disconnect(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.nimbleCrmService.disconnect(userId);
    return wrapResponse(result);
  }

  @Post('sync')
  async sync(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Body() dto: { direction?: 'inbound' | 'outbound' | 'both' },
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.nimbleCrmService.syncAll(userId, dto.direction);
    return wrapResponse(result);
  }

  @Get('contacts')
  async getMappedContacts(@CurrentUser() currentUser: { auth0Id: string; email: string }) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.nimbleCrmService.getMappedContacts(userId);
    return wrapResponse(result);
  }

  @Post('push/:contactId')
  async pushContact(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('contactId') contactId: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.nimbleCrmService.pushContact(userId, contactId);
    return wrapResponse(result);
  }

  @Post('pull/:nimbleCrmId')
  async pullContact(
    @CurrentUser() currentUser: { auth0Id: string; email: string },
    @Param('nimbleCrmId') nimbleCrmId: string,
  ) {
    const userId = await this.resolveUserId(currentUser);
    const result = await this.nimbleCrmService.pullContact(userId, nimbleCrmId);
    return wrapResponse(result);
  }
}
