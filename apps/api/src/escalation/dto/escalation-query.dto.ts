import { IsOptional, IsEnum } from 'class-validator';
import { EscalationTrigger } from '@sovereign/shared';
import { PaginationQueryDto } from '../../common';

export class EscalationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(EscalationTrigger)
  triggerType?: EscalationTrigger;
}
