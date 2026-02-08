import { IsOptional, IsEnum } from 'class-validator';
import { ActionItemStatus, Priority } from '@sovereign/shared';
import { PaginationQueryDto } from '../../common';

export class ActionItemQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ActionItemStatus)
  status?: ActionItemStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}
