import { IsString, IsOptional, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { OwnerType, Priority } from '@sovereign/shared';

export class CreateCommitmentDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  ownerId: string;

  @IsEnum(OwnerType)
  ownerType: OwnerType;

  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  meetingId?: string;

  @IsOptional()
  @IsBoolean()
  affectsScore?: boolean;

  @IsOptional()
  @IsString()
  escalationRuleId?: string;
}
