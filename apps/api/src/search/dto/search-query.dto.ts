import { IsString, IsOptional, IsArray, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../common';

export class SearchQueryDto extends PaginationQueryDto {
  @IsString()
  @MinLength(2)
  q: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entityTypes?: string[];
}
