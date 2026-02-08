import { IsString, IsOptional, IsArray, IsObject, MinLength } from 'class-validator';

export class CreateSavedSearchDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(2)
  query: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entityTypes?: string[];

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  shortcutKey?: string;
}

export class UpdateSavedSearchDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  query?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entityTypes?: string[];

  @IsOptional()
  @IsObject()
  filters?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  shortcutKey?: string;
}
