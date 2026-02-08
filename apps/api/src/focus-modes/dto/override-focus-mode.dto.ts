import { IsString, IsEmail, IsOptional } from 'class-validator';

export class RequestOverrideDto {
  @IsEmail()
  requesterEmail: string;

  @IsString()
  reason: string;
}

export class ResolveOverrideDto {
  @IsString()
  overrideCode: string;

  @IsOptional()
  @IsEmail()
  resolverEmail?: string;
}
