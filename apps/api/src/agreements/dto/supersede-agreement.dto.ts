import { IsString, IsArray } from 'class-validator';

export class SupersedeAgreementDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  parties: string[];
}
