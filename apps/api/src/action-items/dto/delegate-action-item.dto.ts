import { IsString } from 'class-validator';

export class DelegateActionItemDto {
  @IsString()
  delegateToId: string;
}
