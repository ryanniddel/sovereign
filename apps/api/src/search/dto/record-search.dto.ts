import { IsString, IsOptional, IsArray, IsInt, Min } from 'class-validator';

export class RecordSearchDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entityTypes?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  resultCount?: number;

  @IsOptional()
  @IsString()
  selectedResultId?: string;

  @IsOptional()
  @IsString()
  selectedResultType?: string;
}
