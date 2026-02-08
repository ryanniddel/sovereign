import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

export const QUEUE_NAMES = {
  ESCALATION: 'escalation',
  NOTIFICATION: 'notification',
  BRIEFING: 'briefing',
  SYNC: 'sync',
  AI_PROCESSING: 'ai-processing',
} as const;

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.ESCALATION },
      { name: QUEUE_NAMES.NOTIFICATION },
      { name: QUEUE_NAMES.BRIEFING },
      { name: QUEUE_NAMES.SYNC },
      { name: QUEUE_NAMES.AI_PROCESSING },
    ),
  ],
  exports: [BullModule],
})
export class QueueModule {}
