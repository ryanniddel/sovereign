import { IsString, IsOptional, IsDateString } from 'class-validator';

export class DistributePreReadDto {
  @IsString()
  preReadUrl: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}
