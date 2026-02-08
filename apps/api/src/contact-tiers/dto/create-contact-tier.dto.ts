import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateContactTierDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  escalationDelayMinutes?: number;

  @IsOptional()
  @IsString()
  calendarAccessLevel?: string;

  @IsOptional()
  @IsString()
  communicationPriority?: string;
}
