import { IsOptional, IsEnum } from 'class-validator';
import { CommitmentStatus, Priority } from '@sovereign/shared';
import { PaginationQueryDto } from '../../common';

export class CommitmentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(CommitmentStatus)
  status?: CommitmentStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}
