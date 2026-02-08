import { IsString, IsArray, IsOptional, IsDateString } from 'class-validator';

export class CreateAgreementDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  parties: string[];

  @IsOptional()
  @IsDateString()
  agreedAt?: string;

  @IsOptional()
  @IsString()
  meetingId?: string;
}
