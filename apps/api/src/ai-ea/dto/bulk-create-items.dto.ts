import { IsArray, ValidateNested, IsString, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class ActionItemInput {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  ownerEmail: string;

  @IsDateString()
  dueDate: string;
}

class CommitmentInput {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  ownerEmail: string;

  @IsDateString()
  dueDate: string;
}

class AgreementInput {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsString({ each: true })
  parties: string[];
}

export class BulkCreateItemsDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  meetingId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionItemInput)
  actionItems?: ActionItemInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitmentInput)
  commitments?: CommitmentInput[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgreementInput)
  agreements?: AgreementInput[];
}
