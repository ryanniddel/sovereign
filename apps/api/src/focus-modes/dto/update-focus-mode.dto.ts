import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, IsArray, Min, Max, Matches } from 'class-validator';
import { FocusModeTrigger, CalendarEventType } from '@sovereign/shared';

export class UpdateFocusModeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  allowCriticalOnly?: boolean;

  @IsOptional()
  @IsBoolean()
  allowMeetingPrep?: boolean;

  @IsOptional()
  @IsBoolean()
  allowAll?: boolean;

  @IsOptional()
  @IsEnum(FocusModeTrigger)
  triggerType?: FocusModeTrigger;

  @IsOptional()
  @IsEnum(CalendarEventType)
  triggerCalendarEventType?: CalendarEventType;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'scheduleStartTime must be HH:MM format' })
  scheduleStartTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'scheduleEndTime must be HH:MM format' })
  scheduleEndTime?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  scheduleDays?: number[];

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  autoDeactivateMinutes?: number;

  @IsOptional()
  @IsBoolean()
  requires2faOverride?: boolean;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  icon?: string;
}
