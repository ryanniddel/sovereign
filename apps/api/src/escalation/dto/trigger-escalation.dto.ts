import { IsString, IsEnum } from 'class-validator';
import { EscalationTargetType } from '@sovereign/shared';

export class TriggerEscalationDto {
  @IsString()
  targetId: string;

  @IsEnum(EscalationTargetType)
  targetType: EscalationTargetType;

  @IsString()
  escalationRuleId: string;
}
