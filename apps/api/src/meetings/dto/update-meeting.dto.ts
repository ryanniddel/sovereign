import { IsString, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { MeetingType } from '@sovereign/shared';

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  purpose?: string;

  @IsOptional()
  @IsString()
  decisionRequired?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  estimatedDurationMinutes?: number;

  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;
}
