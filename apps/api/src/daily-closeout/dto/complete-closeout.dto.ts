import { IsOptional, IsString } from 'class-validator';

export class CompleteCloseoutDto {
  @IsOptional()
  @IsString()
  reflectionNotes?: string;
}
