import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Priority } from '@sovereign/shared';

export class UpdateActionItemDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;
}
