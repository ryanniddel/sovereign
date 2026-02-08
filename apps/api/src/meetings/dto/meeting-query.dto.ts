import { IsOptional, IsEnum } from 'class-validator';
import { MeetingStatus, MeetingType } from '@sovereign/shared';
import { PaginationQueryDto } from '../../common';

export class MeetingQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;
}
