import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { EscalationChannel, NotificationContext, Priority } from '@sovereign/shared';

export class UpdateNotificationPreferenceDto {
  @IsEnum(EscalationChannel)
  channel: EscalationChannel;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsEnum(NotificationContext)
  context?: NotificationContext;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}
