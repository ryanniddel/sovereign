import { IsString, IsOptional, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { CalendarEventType } from '@sovereign/shared';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(CalendarEventType)
  eventType?: CalendarEventType;

  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;
}
