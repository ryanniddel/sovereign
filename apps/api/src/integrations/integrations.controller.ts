import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { IntegrationsService } from './integrations.service';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { wrapResponse } from '../common/helpers/response.helper';
import { ConnectPhoneDto, VerifyPhoneDto } from './dto/connect-phone.dto';

@Controller('integrations')
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor(
    private readonly integrationsService: IntegrationsService,
    private readonly usersService: UsersService,
    private readonly config: ConfigService,
  ) {}

  /** GET /integrations/status — overview of all integrations */
  @Get('status')
  async getStatus(@CurrentUser() user: { auth0Id: string; email?: string }) {
    const sovereignUser = await this.usersService.findOrCreateFromAuth0(
      user.auth0Id,
      user.email,
    );
    const data = await this.integrationsService.getStatus(sovereignUser.id);
    return wrapResponse(data);
  }

  /** GET /integrations/:provider/authorize — get OAuth redirect URL */
  @Get(':provider/authorize')
  async authorize(
    @Param('provider') provider: string,
    @CurrentUser() user: { auth0Id: string; email?: string },
  ) {
    this.validateProvider(provider);
    const sovereignUser = await this.usersService.findOrCreateFromAuth0(
      user.auth0Id,
      user.email,
    );
    const authorizeUrl = this.integrationsService.getAuthorizeUrl(
      sovereignUser.id,
      provider.toUpperCase(),
    );
    return wrapResponse({ authorizeUrl });
  }

  /** GET /integrations/:provider/callback — OAuth callback (public, no JWT) */
  @Public()
  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl =
      this.config.get<string>('integrations.frontendUrl') ||
      'http://localhost:3000';

    if (error) {
      this.logger.warn(`OAuth error for ${provider}: ${error}`);
      return res.redirect(
        `${frontendUrl}/settings/integrations?error=${encodeURIComponent(error)}`,
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${frontendUrl}/settings/integrations?error=missing_params`,
      );
    }

    try {
      await this.integrationsService.handleCallback(code, state);
      return res.redirect(
        `${frontendUrl}/settings/integrations?connected=${provider}`,
      );
    } catch (err) {
      this.logger.error(`OAuth callback failed for ${provider}:`, err);
      return res.redirect(
        `${frontendUrl}/settings/integrations?error=connection_failed`,
      );
    }
  }

  /** DELETE /integrations/:provider/disconnect */
  @Delete(':provider/disconnect')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnect(
    @Param('provider') provider: string,
    @CurrentUser() user: { auth0Id: string; email?: string },
  ) {
    this.validateProvider(provider);
    const sovereignUser = await this.usersService.findOrCreateFromAuth0(
      user.auth0Id,
      user.email,
    );
    await this.integrationsService.disconnect(
      sovereignUser.id,
      provider.toUpperCase(),
    );
  }

  /** GET /integrations/microsoft/calendars */
  @Get('microsoft/calendars')
  async microsoftCalendars(
    @CurrentUser() user: { auth0Id: string; email?: string },
  ) {
    const sovereignUser = await this.usersService.findOrCreateFromAuth0(
      user.auth0Id,
      user.email,
    );
    const calendars = await this.integrationsService.listCalendars(
      sovereignUser.id,
      'MICROSOFT',
    );
    return wrapResponse(calendars);
  }

  /** GET /integrations/google/calendars */
  @Get('google/calendars')
  async googleCalendars(
    @CurrentUser() user: { auth0Id: string; email?: string },
  ) {
    const sovereignUser = await this.usersService.findOrCreateFromAuth0(
      user.auth0Id,
      user.email,
    );
    const calendars = await this.integrationsService.listCalendars(
      sovereignUser.id,
      'GOOGLE',
    );
    return wrapResponse(calendars);
  }

  /** GET /integrations/slack/channels */
  @Get('slack/channels')
  async slackChannels(
    @CurrentUser() user: { auth0Id: string; email?: string },
  ) {
    const sovereignUser = await this.usersService.findOrCreateFromAuth0(
      user.auth0Id,
      user.email,
    );
    const channels = await this.integrationsService.listSlackChannels(
      sovereignUser.id,
    );
    return wrapResponse(channels);
  }

  /** POST /integrations/phone/connect */
  @Post('phone/connect')
  async connectPhone(
    @Body() dto: ConnectPhoneDto,
    @CurrentUser() user: { auth0Id: string; email?: string },
  ) {
    const sovereignUser = await this.usersService.findOrCreateFromAuth0(
      user.auth0Id,
      user.email,
    );
    await this.integrationsService.connectPhone(
      sovereignUser.id,
      dto.phoneNumber,
    );
    return wrapResponse(null, 'Verification SMS sent');
  }

  /** POST /integrations/phone/verify */
  @Post('phone/verify')
  async verifyPhone(
    @Body() dto: VerifyPhoneDto,
    @CurrentUser() user: { auth0Id: string; email?: string },
  ) {
    const sovereignUser = await this.usersService.findOrCreateFromAuth0(
      user.auth0Id,
      user.email,
    );
    await this.integrationsService.verifyPhone(sovereignUser.id, dto.code);
    return wrapResponse(null, 'Phone verified');
  }

  /** DELETE /integrations/phone/disconnect */
  @Delete('phone/disconnect')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnectPhone(
    @CurrentUser() user: { auth0Id: string; email?: string },
  ) {
    const sovereignUser = await this.usersService.findOrCreateFromAuth0(
      user.auth0Id,
      user.email,
    );
    await this.integrationsService.disconnectPhone(sovereignUser.id);
  }

  private validateProvider(provider: string) {
    const valid = ['microsoft', 'google', 'zoom', 'slack'];
    if (!valid.includes(provider.toLowerCase())) {
      throw new BadRequestException(
        `Invalid provider: ${provider}. Must be one of: ${valid.join(', ')}`,
      );
    }
  }
}
