import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeRegionOrderDto {
  @ApiProperty({
    description: 'New order position for the region (starting from 1)',
    example: 3,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Order must be a valid number' })
  @Min(1, { message: 'Order must be at least 1' })
  order: number;
}
