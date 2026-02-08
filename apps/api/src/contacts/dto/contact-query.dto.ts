import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common';

export class ContactQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  tierId?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
