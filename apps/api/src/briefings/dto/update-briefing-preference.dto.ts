import { IsOptional, IsString, IsEnum, IsBoolean, IsNumber, Min, Max, Matches } from 'class-validator';
import { DeliveryChannel } from '@sovereign/shared';

export class UpdateBriefingPreferenceDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  morningTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  nightlyTime?: string;

  @IsOptional()
  @IsEnum(DeliveryChannel)
  morningChannel?: DeliveryChannel;

  @IsOptional()
  @IsEnum(DeliveryChannel)
  nightlyChannel?: DeliveryChannel;

  @IsOptional()
  @IsBoolean()
  includeMeetingCosts?: boolean;

  @IsOptional()
  @IsBoolean()
  includeActionItems?: boolean;

  @IsOptional()
  @IsBoolean()
  includeStreaks?: boolean;

  @IsOptional()
  @IsBoolean()
  includeReflectionPrompt?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(5)
  @Max(50)
  maxScheduleItems?: number;

  @IsOptional()
  @IsNumber()
  @Min(3)
  @Max(25)
  maxOverdueItems?: number;

  @IsOptional()
  @IsBoolean()
  morningEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  nightlyEnabled?: boolean;
}
