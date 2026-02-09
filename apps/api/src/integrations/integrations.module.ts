import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../database/database.module';
import { UsersModule } from '../users/users.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { MicrosoftGraphClient } from './providers/microsoft-graph.client';
import { GoogleApisClient } from './providers/google-apis.client';
import { ZoomClient } from './providers/zoom.client';
import { SlackClient } from './providers/slack.client';
import { TwilioClient } from './providers/twilio.client';
import { integrationsConfig } from './config/integrations.config';

@Module({
  imports: [
    ConfigModule.forFeature(integrationsConfig),
    DatabaseModule,
    UsersModule,
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, MicrosoftGraphClient, GoogleApisClient, ZoomClient, SlackClient, TwilioClient],
  exports: [IntegrationsService, MicrosoftGraphClient, GoogleApisClient, ZoomClient, SlackClient, TwilioClient],
})
export class IntegrationsModule {}
