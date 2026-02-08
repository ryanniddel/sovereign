import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ParticipantRole } from '@sovereign/shared';

export class AddParticipantDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(ParticipantRole)
  role?: ParticipantRole;

  @IsOptional()
  @IsString()
  contactId?: string;
}
