import { IsDateString, IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class ScheduleMeetingDto {
  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(480)
  travelBufferMinutes?: number;

  @IsOptional()
  @IsString()
  travelOrigin?: string;

  @IsOptional()
  @IsString()
  travelDestination?: string;
}
