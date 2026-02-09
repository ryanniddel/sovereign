import { IsString, IsEnum } from 'class-validator';
import { EscalationTargetType } from '@sovereign/shared';

export class EscalationTargetDto {
  @IsString()
  targetId: string;

  @IsEnum(EscalationTargetType)
  targetType: EscalationTargetType;
}
