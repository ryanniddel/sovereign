import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class QualifyMeetingEaDto {
  @IsString()
  meetingId: string;

  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
