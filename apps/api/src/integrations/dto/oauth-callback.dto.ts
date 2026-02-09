import { IsOptional, IsString } from 'class-validator';

export class OAuthCallbackDto {
  @IsString()
  code: string;

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  error?: string;
}
