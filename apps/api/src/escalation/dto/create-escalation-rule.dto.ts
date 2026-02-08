import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EscalationTrigger } from '@sovereign/shared';

class EscalationStepDto {
  stepOrder: number;
  channel: string;
  delayMinutes: number;
  tone: string;
  messageTemplate?: string;
  recipientEmail?: string;
  recipientContactId?: string;
}

export class CreateEscalationRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(EscalationTrigger)
  triggerType: EscalationTrigger;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EscalationStepDto)
  steps: EscalationStepDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxRetries?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cooldownMinutes?: number;

  @IsOptional()
  @IsBoolean()
  stopOnResponse?: boolean;
}
