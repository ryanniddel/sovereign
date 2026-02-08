import { IsArray, ValidateNested, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class ItemResolution {
  @IsString()
  itemId: string;

  @IsString()
  itemType: 'commitment' | 'actionItem';

  @IsEnum(['completed', 'rescheduled', 'delegated'])
  resolution: 'completed' | 'rescheduled' | 'delegated';

  @IsString()
  newDueDate?: string;

  @IsString()
  delegateToId?: string;
}

export class ResolveItemsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemResolution)
  resolutions: ItemResolution[];
}
