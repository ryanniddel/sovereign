import { IsDateString, IsOptional, IsString } from 'class-validator';

export class RescheduleMeetingDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  location?: string;
}
