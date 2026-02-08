import { IsDateString, IsOptional, IsString } from 'class-validator';

export class RescheduleActionItemDto {
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
