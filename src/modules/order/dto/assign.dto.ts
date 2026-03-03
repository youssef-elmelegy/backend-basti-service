import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignBakeryDto {
  @ApiProperty({
    name: 'bakeryId',
    description: 'The unique identifier of the bakery to assign the order to.',
  })
  @IsUUID()
  bakeryId?: string;
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
