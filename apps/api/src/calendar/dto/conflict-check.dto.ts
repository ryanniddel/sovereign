import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ConflictCheckDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  excludeEventId?: string; // exclude current event when checking on update
}
