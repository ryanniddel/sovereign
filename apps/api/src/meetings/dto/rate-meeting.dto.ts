import { IsInt, Min, Max, IsOptional, IsBoolean } from 'class-validator';

export class RateMeetingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  valueScore?: number;

  @IsOptional()
  @IsBoolean()
  wasNecessary?: boolean;
}
