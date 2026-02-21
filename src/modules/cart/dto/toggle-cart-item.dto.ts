import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleCartItemDto {
  @ApiProperty({
    name: 'isIncluded',
    description: 'Whether the cart item is included or not',
  })
  @IsBoolean()
  isIncluded: boolean;
}
