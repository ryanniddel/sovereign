import { IsString, IsEnum, IsOptional } from 'class-validator';
import { EscalationChannel, Priority, NotificationCategory } from '@sovereign/shared';

export class SendNotificationDto {
  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(EscalationChannel)
  channel?: EscalationChannel;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsEnum(NotificationCategory)
  category?: NotificationCategory;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  targetId?: string;

  @IsOptional()
  @IsString()
  groupKey?: string;
}
