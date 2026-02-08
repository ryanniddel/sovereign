import { IsOptional, IsNumber, IsString, IsInt, Min, Max } from 'class-validator';

export class UpdatePsychometricsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discD?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discI?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discS?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discC?: number;

  @IsOptional()
  @IsString()
  kolbeProfile?: string;

  @IsOptional()
  @IsString()
  mbtiType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9)
  enneagramType?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bigFiveOpenness?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bigFiveConscientiousness?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bigFiveExtraversion?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bigFiveAgreeableness?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bigFiveNeuroticism?: number;
}
