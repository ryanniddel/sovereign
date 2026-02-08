import { IsString, Matches } from 'class-validator';

export class UpdateWorkingHoursDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'workingHoursStart must be in HH:mm format' })
  workingHoursStart: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'workingHoursEnd must be in HH:mm format' })
  workingHoursEnd: string;
}
