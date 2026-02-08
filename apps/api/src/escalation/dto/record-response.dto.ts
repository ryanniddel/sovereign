import { IsString, IsOptional } from 'class-validator';

export class RecordResponseDto {
  @IsString()
  logId: string;

  @IsOptional()
  @IsString()
  responseContent?: string;
}
