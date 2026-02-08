import { IsOptional, IsString } from 'class-validator';

export class CompleteBriefingDto {
  @IsOptional()
  @IsString()
  notes?: string;
}
