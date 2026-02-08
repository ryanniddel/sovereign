import { IsString, IsEnum, IsOptional } from 'class-validator';
import { EscalationChannel, Priority } from '@sovereign/shared';

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
}
