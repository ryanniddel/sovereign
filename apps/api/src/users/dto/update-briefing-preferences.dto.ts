import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateBriefingPreferencesDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'morningBriefingTime must be in HH:mm format' })
  morningBriefingTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'nightlyReviewTime must be in HH:mm format' })
  nightlyReviewTime?: string;
}
