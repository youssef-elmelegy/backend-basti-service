import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, IsUUID, IsBoolean } from 'class-validator';

export class UpdateQuantityDto {
  @ApiProperty({
    name: 'quantity',
    description: 'Quantity of the item to add',
  })
  @IsNumber()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({
    name: 'regionId',
    description: 'region ID',
  })
  @IsUUID()
  regionId: string;
}

export class ToggleStatusDto {
  @ApiProperty({
    name: 'isIncluded',
    description: 'Whether the cart item is included or not',
  })
  @IsBoolean()
  isIncluded: boolean;

  @ApiProperty({
    name: 'regionId',
    description: 'region ID',
  })
  @IsUUID()
  regionId: string;
}
