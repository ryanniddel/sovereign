import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsBoolean, IsNumber, Min, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { EscalationTrigger } from '@sovereign/shared';
import { EscalationStepDto } from './escalation-step.dto';

export class UpdateEscalationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(EscalationTrigger)
  triggerType?: EscalationTrigger;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EscalationStepDto)
  steps?: EscalationStepDto[];

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
