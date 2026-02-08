import { IsString, IsOptional, IsDateString, IsBoolean, IsEnum, IsInt, Min, Max } from 'class-validator';
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

  // Travel buffer
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

  // Buffer time (5-min increments)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  bufferBeforeMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  bufferAfterMinutes?: number;

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
