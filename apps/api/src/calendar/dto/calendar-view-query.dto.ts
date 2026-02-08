import { IsDateString, IsOptional } from 'class-validator';

export class CalendarViewQueryDto {
  @IsDateString()
  date: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
