import { IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignBakeryDto {
  @ApiProperty({
    name: 'bakeryId',
    description: 'The unique identifier of the bakery to assign the order to.',
  })
  @IsUUID()
  bakeryId: string;

  @ApiProperty({
    name: 'force',
    description:
      'When true, reassign even if the target bakery cannot fully stock the order items. Stock is reserved best-effort and never blocks the move.',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}

export class AssignBakeryResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the order',
  })
  id: string;

  @ApiProperty({
    description: 'The unique identifier of the assigned bakery',
  })
  bakeryId: string;
}

export class AvailableBakeryDto {
  @ApiProperty({ description: 'The unique identifier of the bakery' })
  id: string;

  @ApiProperty({ description: 'The bakery name' })
  name: string;

  @ApiProperty({ description: 'The order types this bakery handles', isArray: true, type: String })
  types: string[];

  @ApiProperty({ description: 'The total order capacity of the bakery' })
  capacity: number;

  @ApiProperty({ description: 'Capacity currently used by the bakery active orders' })
  usedCapacity: number;

  @ApiProperty({ description: 'Remaining capacity (capacity - usedCapacity, never below 0)' })
  availableCapacity: number;

  @ApiProperty({ description: 'Whether this bakery is the one currently assigned to the order' })
  isCurrent: boolean;
}
