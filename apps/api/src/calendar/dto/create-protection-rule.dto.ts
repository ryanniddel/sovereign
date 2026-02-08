import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ProtectionRuleType } from '@sovereign/shared';

export class CreateProtectionRuleDto {
  @IsString()
  name: string;

  @IsEnum(ProtectionRuleType)
  type: ProtectionRuleType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // UNBOOKABLE_HOURS
  @IsOptional()
  @IsString()
  startTime?: string; // "00:00"

  @IsOptional()
  @IsString()
  endTime?: string; // "09:00"

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  daysOfWeek?: number[]; // [0,1,2,3,4,5,6]

  // BUFFER_TIME — 5-min increments
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  bufferMinutes?: number;

  // MAX_DAILY_MEETINGS
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxCount?: number;

  // FOCUS_PROTECTION
  @IsOptional()
  @IsBoolean()
  requires2faOverride?: boolean;
}
