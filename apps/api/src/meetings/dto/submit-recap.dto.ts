import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

class ExtractedActionItem {
  @IsString()
  title: string;

  @IsString()
  ownerEmail: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

class ExtractedCommitment {
  @IsString()
  title: string;

  @IsString()
  ownerEmail: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

class ExtractedAgreement {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  parties?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

class DetectedContradiction {
  @IsString()
  newItem: string;

  @IsString()
  existingAgreement: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;
}

export class SubmitRecapDto {
  @IsOptional()
  @IsString()
  transcriptUrl?: string;

  @IsOptional()
  @IsString()
  recapContent?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  actualDurationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  autoCreateItems?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedActionItem)
  actionItems?: ExtractedActionItem[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedCommitment)
  commitments?: ExtractedCommitment[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExtractedAgreement)
  agreements?: ExtractedAgreement[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetectedContradiction)
  contradictions?: DetectedContradiction[];
}
