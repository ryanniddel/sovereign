import { IsString } from 'class-validator';

export class OverrideFocusModeDto {
  @IsString()
  confirmationCode: string;
}
