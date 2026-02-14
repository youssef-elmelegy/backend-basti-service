import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString } from 'class-validator';

export class DesignedCakeConfigRequestDto {
  @ApiProperty({
    description: 'Flavor ID for the cake configuration',
    example: '456f1234-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsNotEmpty()
  flavorId: string;

  @ApiProperty({
    description: 'Decoration ID for the cake configuration',
    example: '456f1234-e89b-12d3-a456-426614174002',
  })
  @IsUUID()
  @IsNotEmpty()
  decorationId: string;

  @ApiProperty({
    description: 'Shape ID for the cake configuration',
    example: '456f1234-e89b-12d3-a456-426614174003',
  })
  @IsUUID()
  @IsNotEmpty()
  shapeId: string;

  @ApiProperty({
    description: 'Frosting color value (hex color)',
    example: '#DC143C',
  })
  @IsString()
  @IsNotEmpty()
  frostColorValue: string;
}
