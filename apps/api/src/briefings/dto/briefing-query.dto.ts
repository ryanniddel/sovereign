import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { BriefingType } from '@sovereign/shared';

export class BriefingQueryDto {
  @IsOptional()
  @IsEnum(BriefingType)
  type?: BriefingType;

  @IsOptional()
  @IsDateString()
  date?: string;
}
