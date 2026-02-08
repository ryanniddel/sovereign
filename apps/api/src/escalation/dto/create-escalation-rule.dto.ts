import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { EscalationTrigger } from '@sovereign/shared';

class EscalationStepDto {
  stepOrder: number;
  channel: string;
  delayMinutes: number;
  tone: string;
  messageTemplate?: string;
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
}
