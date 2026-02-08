import { IsString, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

class EscalationStepDto {
  stepOrder: number;
  channel: string;
  delayMinutes: number;
  tone: string;
  messageTemplate?: string;
}

export class UpdateEscalationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EscalationStepDto)
  steps?: EscalationStepDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
