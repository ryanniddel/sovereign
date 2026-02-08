import { IsString, IsOptional, IsArray } from 'class-validator';

export class ContextQueryDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entityTypes?: string[];
}
