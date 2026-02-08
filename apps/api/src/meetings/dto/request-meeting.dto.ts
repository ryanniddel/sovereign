import { IsString, IsOptional, IsInt, IsArray, IsEnum, Min } from 'class-validator';
import { MeetingType } from '@sovereign/shared';

export class RequestMeetingDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  purpose: string;

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

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantEmails?: string[];

  @IsOptional()
  @IsString()
  agendaUrl?: string;

  @IsOptional()
  @IsString()
  preReadUrl?: string;
}
