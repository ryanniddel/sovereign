import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { encrypt, decrypt } from './providers/token-encryption';
import { signState, verifyState, exchangeCode } from './providers/oauth-helpers';
import { IntegrationProvider, OAuthConnectionStatus } from '@prisma/client';

type ProviderConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authorizeUrl: string;
  tokenUrl: string;
};

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly encryptionKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.encryptionKey =
      this.config.get<string>('integrations.tokenEncryptionKey') || '';
  }

  // ── Status Overview ──

  async getStatus(userId: string) {
    const connections = await this.prisma.oAuthConnection.findMany({
      where: { userId },
    });
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true, phoneVerified: true },
    });

    const providers: Array<
      IntegrationProvider | 'TWILIO' | 'NIMBLE'
    > = ['MICROSOFT', 'GOOGLE', 'ZOOM', 'SLACK'];

    const integrations = providers.map((provider) => {
      const conn = connections.find(
        (c) => c.provider === provider,
      );
      return {
        provider,
        connected: conn?.status === 'ACTIVE',
        accountEmail: conn?.externalAccountEmail ?? undefined,
        accountName: conn?.externalAccountName ?? undefined,
        status: conn?.status ?? 'DISCONNECTED',
        lastUsedAt: conn?.lastUsedAt ?? undefined,
        lastError: conn?.lastError ?? undefined,
      };
    });

    // Nimble CRM (separate env-based integration)
    const nimbleKey = this.config.get<string>('NIMBLE_API_KEY');
    integrations.push({
      provider: 'NIMBLE' as const,
      connected: !!nimbleKey,
      accountEmail: undefined,
      accountName: undefined,
      status: nimbleKey ? 'ACTIVE' : ('DISCONNECTED' as OAuthConnectionStatus),
      lastUsedAt: undefined,
      lastError: undefined,
    });

    return {
      integrations,
      phone: {
        connected: !!user?.phoneNumber,
        phoneNumber: user?.phoneNumber ?? undefined,
        verified: user?.phoneVerified ?? false,
      },
    };
  }

  // ── OAuth Authorize URL ──

  getAuthorizeUrl(userId: string, provider: string): string {
    const cfg = this.getProviderConfig(provider);
    const state = signState(userId, provider);

    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: cfg.redirectUri,
      response_type: 'code',
      state,
    });

    // Provider-specific scope format
    if (provider === 'SLACK') {
      params.set('scope', cfg.scopes.join(','));
    } else {
      params.set('scope', cfg.scopes.join(' '));
    }

    if (provider === 'GOOGLE') {
      params.set('access_type', 'offline');
      params.set('prompt', 'consent');
    }

    return `${cfg.authorizeUrl}?${params.toString()}`;
  }

  // ── OAuth Callback ──

  async handleCallback(
    code: string,
    state: string,
  ): Promise<{ userId: string; provider: string }> {
    const verified = verifyState(state);
    if (!verified) {
      throw new BadRequestException('Invalid or expired OAuth state');
    }

    const { userId, provider } = verified;
    const cfg = this.getProviderConfig(provider);

    const tokenParams: Record<string, string> = {
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code,
      redirect_uri: cfg.redirectUri,
      grant_type: 'authorization_code',
    };

    const tokenResponse = await exchangeCode(cfg.tokenUrl, tokenParams);

    // Slack returns tokens differently
    let accessToken = tokenResponse.access_token;
    let scope = tokenResponse.scope;
    if (provider === 'SLACK' && tokenResponse.authed_user) {
      accessToken = tokenResponse.authed_user.access_token;
      scope = tokenResponse.authed_user.scope;
    }

    const encryptedAccess = encrypt(accessToken, this.encryptionKey);
    const encryptedRefresh = tokenResponse.refresh_token
      ? encrypt(tokenResponse.refresh_token, this.encryptionKey)
      : null;

    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000)
      : null;

    // Fetch external account info
    const accountInfo = await this.fetchAccountInfo(
      provider,
      accessToken,
    );

    await this.prisma.oAuthConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: provider as IntegrationProvider,
        },
      },
      create: {
        userId,
        provider: provider as IntegrationProvider,
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: expiresAt,
        scope: scope ?? null,
        externalAccountId: accountInfo.id ?? null,
        externalAccountEmail: accountInfo.email ?? null,
        externalAccountName: accountInfo.name ?? null,
        status: 'ACTIVE',
        lastUsedAt: new Date(),
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: expiresAt,
        scope: scope ?? null,
        externalAccountId: accountInfo.id ?? null,
        externalAccountEmail: accountInfo.email ?? null,
        externalAccountName: accountInfo.name ?? null,
        status: 'ACTIVE',
        lastError: null,
        lastUsedAt: new Date(),
      },
    });

    this.logger.log(
      `OAuth connected: ${provider} for user ${userId} (${accountInfo.email})`,
    );

    return { userId, provider };
  }

  // ── Disconnect ──

  async disconnect(userId: string, provider: string): Promise<void> {
    const providerEnum = provider.toUpperCase() as IntegrationProvider;

    // Best-effort: revoke token at provider before disconnecting
    const tokens = await this.getDecryptedTokens(userId, providerEnum);
    if (tokens) {
      try {
        await this.revokeAtProvider(providerEnum, tokens.accessToken);
      } catch (err) {
        this.logger.warn(`Token revocation at ${provider} failed (non-fatal): ${err}`);
      }
    }

    await this.prisma.oAuthConnection.updateMany({
      where: { userId, provider: providerEnum },
      data: { status: 'REVOKED' },
    });
  }

  /** Mark a connection as expired (called by provider clients on 401) */
  async markConnectionExpired(
    userId: string,
    provider: IntegrationProvider,
  ): Promise<void> {
    await this.prisma.oAuthConnection.updateMany({
      where: { userId, provider, status: 'ACTIVE' },
      data: {
        status: 'EXPIRED',
        lastError: 'Token rejected by provider (HTTP 401)',
      },
    });
    this.logger.warn(
      `Marked ${provider} connection as EXPIRED for user ${userId} (401 from provider)`,
    );
  }

  // ── Phone (Twilio) ──

  async connectPhone(userId: string, phoneNumber: string): Promise<void> {
    const twilioConfig = this.config.get('integrations.twilio');
    if (!twilioConfig?.accountSid) {
      throw new BadRequestException(
        'SMS integration is not configured. Please set TWILIO_ACCOUNT_SID.',
      );
    }

    // Store phone number (unverified)
    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneNumber, phoneVerified: false },
    });

    // Send verification code via Twilio Verify
    try {
      const twilio = await import('twilio');
      const client = twilio.default(
        twilioConfig.accountSid,
        twilioConfig.authToken,
      );
      await client.verify.v2
        .services(twilioConfig.verifyServiceSid)
        .verifications.create({ to: phoneNumber, channel: 'sms' });
      this.logger.log(`Verification SMS sent to ${phoneNumber}`);
    } catch (err) {
      this.logger.error(`Twilio verification failed: ${err}`);
      throw new BadRequestException(
        'Failed to send verification SMS. Check the phone number.',
      );
    }
  }

  async verifyPhone(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true },
    });
    if (!user?.phoneNumber) {
      throw new BadRequestException('No phone number to verify');
    }

    const twilioConfig = this.config.get('integrations.twilio');
    try {
      const twilio = await import('twilio');
      const client = twilio.default(
        twilioConfig.accountSid,
        twilioConfig.authToken,
      );
      const check = await client.verify.v2
        .services(twilioConfig.verifyServiceSid)
        .verificationChecks.create({ to: user.phoneNumber, code });

      if (check.status !== 'approved') {
        throw new BadRequestException('Invalid verification code');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { phoneVerified: true },
      });
      this.logger.log(`Phone verified for user ${userId}`);
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`Twilio verify check failed: ${err}`);
      throw new BadRequestException('Verification failed');
    }
  }

  async disconnectPhone(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { phoneNumber: null, phoneVerified: false },
    });
  }

  // ── Token Access (for provider clients) ──

  async getDecryptedTokens(
    userId: string,
    provider: IntegrationProvider,
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  } | null> {
    const conn = await this.prisma.oAuthConnection.findUnique({
      where: { userId_provider: { userId, provider } },
    });
    if (!conn || conn.status !== 'ACTIVE') return null;

    // Check if token needs refresh
    if (
      conn.tokenExpiresAt &&
      conn.tokenExpiresAt < new Date(Date.now() + 5 * 60 * 1000)
    ) {
      if (conn.refreshToken) {
        try {
          return await this.refreshTokens(userId, provider, conn);
        } catch (err) {
          this.logger.error(
            `Token refresh failed for ${provider}/${userId}: ${err}`,
          );
          await this.prisma.oAuthConnection.update({
            where: { id: conn.id },
            data: { status: 'EXPIRED', lastError: String(err) },
          });
          return null;
        }
      }
      return null;
    }

    // Update lastUsedAt
    await this.prisma.oAuthConnection.update({
      where: { id: conn.id },
      data: { lastUsedAt: new Date() },
    });

    return {
      accessToken: decrypt(conn.accessToken, this.encryptionKey),
      refreshToken: conn.refreshToken
        ? decrypt(conn.refreshToken, this.encryptionKey)
        : undefined,
      expiresAt: conn.tokenExpiresAt ?? undefined,
    };
  }

  // ── Calendar List (for sync config UI) ──

  async listCalendars(
    userId: string,
    provider: string,
  ): Promise<{ id: string; name: string; primary: boolean }[]> {
    const providerEnum = provider.toUpperCase() as IntegrationProvider;
    const tokens = await this.getDecryptedTokens(userId, providerEnum);
    if (!tokens) return [];

    if (providerEnum === 'MICROSOFT') {
      return this.listMicrosoftCalendars(tokens.accessToken);
    }
    if (providerEnum === 'GOOGLE') {
      return this.listGoogleCalendars(tokens.accessToken);
    }
    return [];
  }

  // ── Slack Channel List ──

  async listSlackChannels(
    userId: string,
  ): Promise<{ id: string; name: string }[]> {
    const tokens = await this.getDecryptedTokens(userId, 'SLACK');
    if (!tokens) return [];

    try {
      const { WebClient } = await import('@slack/web-api');
      const client = new WebClient(tokens.accessToken);
      const result = await client.conversations.list({
        types: 'public_channel,private_channel',
        limit: 100,
      });
      return (
        result.channels?.map((c) => ({
          id: c.id!,
          name: c.name || c.id!,
        })) ?? []
      );
    } catch (err) {
      this.logger.error(`Slack channels list failed: ${err}`);
      return [];
    }
  }

  // ── Private Helpers ──

  private async revokeAtProvider(
    provider: IntegrationProvider,
    accessToken: string,
  ): Promise<void> {
    if (provider === 'GOOGLE') {
      await fetch(
        `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(accessToken)}`,
        { method: 'POST', signal: AbortSignal.timeout(5_000) },
      );
    }
    if (provider === 'SLACK') {
      await fetch('https://slack.com/api/auth.revoke', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(5_000),
      });
    }
    // Microsoft and Zoom do not expose simple token revoke endpoints
  }

  private getProviderConfig(provider: string): ProviderConfig {
    const key = provider.toLowerCase();
    const cfg = this.config.get(`integrations.${key}`);
    if (!cfg?.clientId) {
      throw new BadRequestException(
        `Integration ${provider} is not configured. Set ${provider.toUpperCase()}_CLIENT_ID.`,
      );
    }
    return cfg;
  }

  private async refreshTokens(
    userId: string,
    provider: IntegrationProvider,
    conn: { id: string; refreshToken: string | null },
  ) {
    if (!conn.refreshToken) {
      throw new Error('No refresh token available');
    }

    const cfg = this.getProviderConfig(provider);
    const refreshToken = decrypt(conn.refreshToken, this.encryptionKey);

    const tokenResponse = await exchangeCode(cfg.tokenUrl, {
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    const newEncryptedAccess = encrypt(
      tokenResponse.access_token,
      this.encryptionKey,
    );
    const newEncryptedRefresh = tokenResponse.refresh_token
      ? encrypt(tokenResponse.refresh_token, this.encryptionKey)
      : conn.refreshToken; // keep old if not rotated

    const expiresAt = tokenResponse.expires_in
      ? new Date(Date.now() + tokenResponse.expires_in * 1000)
      : null;

    await this.prisma.oAuthConnection.update({
      where: { id: conn.id },
      data: {
        accessToken: newEncryptedAccess,
        refreshToken: newEncryptedRefresh,
        tokenExpiresAt: expiresAt,
        status: 'ACTIVE',
        lastError: null,
        lastUsedAt: new Date(),
      },
    });

    return {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || refreshToken,
      expiresAt: expiresAt ?? undefined,
    };
  }

  private async fetchAccountInfo(
    provider: string,
    accessToken: string,
  ): Promise<{ id?: string; email?: string; name?: string }> {
    try {
      const opts = (token: string) => ({
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      });

      if (provider === 'MICROSOFT') {
        const res = await fetch('https://graph.microsoft.com/v1.0/me', opts(accessToken));
        const data = await res.json();
        return {
          id: data.id,
          email: data.mail || data.userPrincipalName,
          name: data.displayName,
        };
      }
      if (provider === 'GOOGLE') {
        const res = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          opts(accessToken),
        );
        const data = await res.json();
        return { id: data.id, email: data.email, name: data.name };
      }
      if (provider === 'ZOOM') {
        const res = await fetch('https://api.zoom.us/v2/users/me', opts(accessToken));
        const data = await res.json();
        return { id: data.id, email: data.email, name: data.display_name };
      }
      if (provider === 'SLACK') {
        const res = await fetch('https://slack.com/api/auth.test', opts(accessToken));
        const data = await res.json();
        return {
          id: data.user_id,
          email: undefined,
          name: data.user,
        };
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch account info for ${provider}: ${err}`);
    }
    return {};
  }

  private async listMicrosoftCalendars(
    accessToken: string,
  ): Promise<{ id: string; name: string; primary: boolean }[]> {
    try {
      const res = await fetch(
        'https://graph.microsoft.com/v1.0/me/calendars',
        { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10_000) },
      );
      const data = await res.json();
      return (data.value || []).map(
        (cal: { id: string; name: string; isDefaultCalendar?: boolean }) => ({
          id: cal.id,
          name: cal.name,
          primary: cal.isDefaultCalendar ?? false,
        }),
      );
    } catch (err) {
      this.logger.error(`Microsoft calendar list failed: ${err}`);
      return [];
    }
  }

  private async listGoogleCalendars(
    accessToken: string,
  ): Promise<{ id: string; name: string; primary: boolean }[]> {
    try {
      const res = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(10_000) },
      );
      const data = await res.json();
      return (data.items || []).map(
        (cal: { id: string; summary: string; primary?: boolean }) => ({
          id: cal.id,
          name: cal.summary,
          primary: cal.primary ?? false,
        }),
      );
    } catch (err) {
      this.logger.error(`Google calendar list failed: ${err}`);
      return [];
    }
  }
}
