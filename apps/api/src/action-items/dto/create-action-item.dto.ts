import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { OwnerType, Priority, ExternalSystem } from '@sovereign/shared';

export class CreateActionItemDto {
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
  @IsEnum(ExternalSystem)
  externalSystem?: ExternalSystem;

  @IsOptional()
  @IsString()
  externalSystemId?: string;

  @IsOptional()
  @IsString()
  escalationRuleId?: string;
}
