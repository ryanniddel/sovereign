import { IsNumber, Min, Max } from 'class-validator';

export class UpdateDiscDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  discD: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discI: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discS: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  discC: number;
}
