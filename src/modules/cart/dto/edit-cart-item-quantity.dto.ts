import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class UpdateQuantityDto {
  @ApiProperty({
    name: 'quantity',
    description: 'The new quantity for the cart item',
  })
  @IsNumber()
  quantity: number;
}
