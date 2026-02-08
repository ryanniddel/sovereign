import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  Min,
  Max,
} from 'class-validator';

export class UpdateProtectionRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  daysOfWeek?: number[];

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(120)
  bufferMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxCount?: number;

  @IsOptional()
  @IsBoolean()
  requires2faOverride?: boolean;
}
