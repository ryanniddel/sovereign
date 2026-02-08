import { IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateAgreementDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  parties?: string[];
}
