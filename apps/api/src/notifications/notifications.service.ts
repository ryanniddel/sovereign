import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { userId },
    });
  }

  async upsertPreference(userId: string, dto: UpdateNotificationPreferenceDto) {
    const context = dto.context || 'ALL';
    return this.prisma.notificationPreference.upsert({
      where: {
        userId_channel_context: {
          userId,
          channel: dto.channel as any,
          context: context as any,
        },
      },
      create: {
        userId,
        channel: dto.channel as any,
        context: context as any,
        isEnabled: dto.isEnabled ?? true,
        priority: (dto.priority || 'MEDIUM') as any,
      },
      update: {
        isEnabled: dto.isEnabled,
        priority: dto.priority as any,
      },
    });
  }

  async shouldDeliver(userId: string, channel: string, priority: string): Promise<boolean> {
    // Check active focus mode
    const activeFocus = await this.prisma.focusMode.findFirst({
      where: { userId, isActive: true },
    });

    if (activeFocus) {
      if (activeFocus.allowAll) return true;
      if (activeFocus.allowCriticalOnly && priority !== 'CRITICAL') return false;
    }

    // Check notification preferences
    const pref = await this.prisma.notificationPreference.findFirst({
      where: {
        userId,
        channel: channel as any,
        isEnabled: true,
      },
    });

    return !!pref;
  }
}
