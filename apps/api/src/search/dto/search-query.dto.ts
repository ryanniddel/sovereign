import { IsString, IsOptional, IsArray, MinLength, IsEnum, IsDateString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from '../../common';

export const SEARCH_ENTITY_TYPES = [
  'contacts',
  'meetings',
  'commitments',
  'actionItems',
  'agreements',
  'calendarEvents',
  'escalationRules',
  'briefings',
  'focusModes',
] as const;

export class SearchQueryDto extends PaginationQueryDto {
  @IsString()
  @MinLength(2)
  q: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entityTypes?: string[];

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  grouped?: boolean;
}
