import { IsBoolean, IsOptional, IsString, IsEnum } from 'class-validator';
import { QualifiedBy } from '@sovereign/shared';

export class QualifyMeetingDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsEnum(QualifiedBy)
  qualifiedBy?: QualifiedBy;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
