import { IsDateString, IsOptional, IsString } from 'class-validator';

export class RescheduleCommitmentDto {
  @IsDateString()
  dueDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
