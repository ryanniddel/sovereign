import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
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
  @IsBoolean()
  requires2faOverride?: boolean;
}
