import { IsOptional, IsString, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '../../common';

export class FocusModeSessionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  focusModeId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
