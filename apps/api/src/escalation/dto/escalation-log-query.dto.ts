import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { EscalationTargetType, EscalationChannel, EscalationStatus } from '@sovereign/shared';
import { PaginationQueryDto } from '../../common';

export class EscalationLogQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(EscalationTargetType)
  targetType?: EscalationTargetType;

  @IsOptional()
  @IsEnum(EscalationChannel)
  channel?: EscalationChannel;

  @IsOptional()
  @IsEnum(EscalationStatus)
  status?: EscalationStatus;

  @IsOptional()
  @IsString()
  ruleId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
