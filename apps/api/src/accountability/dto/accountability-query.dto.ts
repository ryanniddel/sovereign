import { IsOptional, IsDateString } from 'class-validator';

export class AccountabilityQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
