import { IsOptional, IsEnum } from 'class-validator';

export enum TrendPeriod {
  SEVEN_DAY = '7d',
  THIRTY_DAY = '30d',
  NINETY_DAY = '90d',
}

export class AccountabilityTrendQueryDto {
  @IsOptional()
  @IsEnum(TrendPeriod)
  period?: TrendPeriod;
}
