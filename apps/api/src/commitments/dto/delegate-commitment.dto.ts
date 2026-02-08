import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class DelegateCommitmentDto {
  @IsString()
  delegateToId: string;

  @IsOptional()
  @IsBoolean()
  retainAccountability?: boolean;
}
