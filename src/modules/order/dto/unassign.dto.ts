import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UnassignBakeryDto {
  @ApiProperty({
    name: 'reason',
    description: 'Optional reason for unassigning the order from the bakery',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UnassignBakeryResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the order',
  })
  id: string;

  @ApiProperty({
    description: 'The bakery ID (should be null after unassignment)',
    nullable: true,
  })
  bakeryId: string | null;
}
