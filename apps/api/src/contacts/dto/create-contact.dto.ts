import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateContactDto {
  @IsEmail()
  email: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  tierId?: string;

  @IsOptional()
  @IsString()
  nimbleCrmId?: string;
}
