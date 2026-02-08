import { IsString } from 'class-validator';

export class DashboardQueryDto {
  @IsString()
  userId: string;
}
