import { IsString, Matches, IsOptional } from 'class-validator';

export class ConnectPhoneDto {
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, {
    message: 'Phone number must be in E.164 format (e.g. +15551234567)',
  })
  phoneNumber: string;
}

export class VerifyPhoneDto {
  @IsString()
  @Matches(/^\d{4,8}$/, { message: 'Verification code must be 4-8 digits' })
  code: string;
}
