import { IsOptional, IsInt, Min } from 'class-validator';

export class CompleteMeetingDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  actualDurationMinutes?: number;
}
