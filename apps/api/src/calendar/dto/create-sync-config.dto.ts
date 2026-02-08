import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { CalendarSource, CalendarEventType, SyncDirection } from '@sovereign/shared';

export class CreateSyncConfigDto {
  @IsEnum(CalendarSource)
  source: CalendarSource;

  @IsOptional()
  @IsEnum(SyncDirection)
  direction?: SyncDirection;

  @IsOptional()
  @IsString()
  externalAccountId?: string;

  @IsOptional()
  @IsString()
  externalCalendarId?: string;

  @IsOptional()
  @IsString()
  externalCalendarName?: string;

  @IsOptional()
  @IsBoolean()
  sovereignWins?: boolean;

  @IsOptional()
  @IsEnum(CalendarEventType)
  importAsEventType?: CalendarEventType;

  @IsOptional()
  @IsBoolean()
  autoImportNewEvents?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(60)
  syncIntervalMinutes?: number;
}
