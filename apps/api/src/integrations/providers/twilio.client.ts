import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwilioClient {
  private readonly logger = new Logger(TwilioClient.name);

  constructor(private readonly config: ConfigService) {}

  // ── Private Helpers ──

  private isConfigured(): boolean {
    return !!this.config.get<string>('integrations.twilio.accountSid');
  }

  private async getClient() {
    if (!this.isConfigured()) {
      this.logger.warn('Twilio is not configured — skipping');
      return null;
    }

    const twilio = await import('twilio');
    return twilio.default(
      this.config.get<string>('integrations.twilio.accountSid')!,
      this.config.get<string>('integrations.twilio.authToken')!,
    );
  }

  private getFromNumber(): string {
    return this.config.get<string>('integrations.twilio.phoneNumber') || '';
  }

  private getVerifyServiceSid(): string {
    return (
      this.config.get<string>('integrations.twilio.verifyServiceSid') || ''
    );
  }

  // ── SMS ──

  async sendSms(
    to: string,
    body: string,
  ): Promise<{ sid: string } | null> {
    const client = await this.getClient();
    if (!client) return null;

    try {
      const message = await client.messages.create({
        to,
        from: this.getFromNumber(),
        body,
      });

      this.logger.log(`SMS sent to ${to}, sid=${message.sid}`);
      return { sid: message.sid };
    } catch (err) {
      this.logger.error(`Twilio sendSms failed to ${to}: ${err}`);
      return null;
    }
  }

  // ── Voice Call ──

  async makeCall(
    to: string,
    twiml: string,
  ): Promise<{ sid: string } | null> {
    const client = await this.getClient();
    if (!client) return null;

    try {
      const call = await client.calls.create({
        to,
        from: this.getFromNumber(),
        twiml,
      });

      this.logger.log(`Call initiated to ${to}, sid=${call.sid}`);
      return { sid: call.sid };
    } catch (err) {
      this.logger.error(`Twilio makeCall failed to ${to}: ${err}`);
      return null;
    }
  }

  // ── Phone Verification ──

  async sendVerification(to: string): Promise<boolean> {
    const client = await this.getClient();
    if (!client) return false;

    const serviceSid = this.getVerifyServiceSid();
    if (!serviceSid) {
      this.logger.warn(
        'Twilio Verify service SID not configured — skipping verification',
      );
      return false;
    }

    try {
      await client.verify.v2
        .services(serviceSid)
        .verifications.create({ to, channel: 'sms' });

      this.logger.log(`Verification SMS sent to ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Twilio sendVerification failed to ${to}: ${err}`);
      return false;
    }
  }

  async checkVerification(to: string, code: string): Promise<boolean> {
    const client = await this.getClient();
    if (!client) return false;

    const serviceSid = this.getVerifyServiceSid();
    if (!serviceSid) {
      this.logger.warn(
        'Twilio Verify service SID not configured — skipping check',
      );
      return false;
    }

    try {
      const check = await client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({ to, code });

      const approved = check.status === 'approved';
      this.logger.log(
        `Verification check for ${to}: ${check.status}`,
      );
      return approved;
    } catch (err) {
      this.logger.error(`Twilio checkVerification failed for ${to}: ${err}`);
      return false;
    }
  }
}
