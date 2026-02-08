import { IsString, IsOptional, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { CalendarEventType, CalendarSource } from '@sovereign/shared';

export class CreateEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

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

  @IsOptional()
  @IsString()
  externalCalendarId?: string;

  @IsOptional()
  @IsEnum(CalendarSource)
  source?: CalendarSource;

  @IsOptional()
  @IsString()
  meetingId?: string;
}
