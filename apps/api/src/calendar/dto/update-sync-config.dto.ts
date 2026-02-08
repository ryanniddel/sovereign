import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { CalendarEventType, SyncDirection, SyncStatus } from '@sovereign/shared';

export class UpdateSyncConfigDto {
  @IsOptional()
  @IsEnum(SyncDirection)
  direction?: SyncDirection;

  @IsOptional()
  @IsEnum(SyncStatus)
  status?: SyncStatus;

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
