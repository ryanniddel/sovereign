import { IsNumber, IsString, IsOptional, IsEnum, Min } from 'class-validator';
import { EscalationChannel, EscalationTone } from '@sovereign/shared';

export class EscalationStepDto {
  @IsNumber()
  @Min(1)
  stepOrder: number;

  @IsEnum(EscalationChannel)
  channel: EscalationChannel;

  @IsNumber()
  @Min(0)
  delayMinutes: number;

  @IsEnum(EscalationTone)
  tone: EscalationTone;

  @IsOptional()
  @IsString()
  messageTemplate?: string;

  @IsOptional()
  @IsString()
  recipientEmail?: string;

  @IsOptional()
  @IsString()
  recipientContactId?: string;
}
