import { IsOptional, IsString, IsDateString, IsIn } from 'class-validator';
import { PaginationQueryDto } from '../../common';

export class SchedulerHistoryQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  jobName?: string;

  @IsOptional()
  @IsIn(['RUNNING', 'COMPLETED', 'FAILED', 'TIMED_OUT'])
  status?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
