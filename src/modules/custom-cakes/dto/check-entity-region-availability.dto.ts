import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CheckEntityRegionAvailabilityDto {
  @ApiProperty({
    description: 'Region ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  regionId: string;

  @ApiProperty({
    description: 'Entity ID (flavor, shape, or decoration)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  entityId: string;
}
