import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFlavorRegionItemPriceDto {
  @ApiProperty({
    description: 'Region ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  regionId: string;

  @ApiProperty({
    description: 'Flavor ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  flavorId: string;

  @ApiProperty({
    description: 'Price for this flavor in the region',
    example: 15.99,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'price must be a valid decimal number with max 2 decimal places' },
  )
  @Min(0, { message: 'price must be greater than or equal to 0' })
  price: number;
}

export class FlavorRegionItemPriceResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174003' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  regionId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  flavorId: string;

  @ApiProperty({ example: '15.99' })
  price: string;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  updatedAt: Date;
}

export class SuccessFlavorRegionItemPriceResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Flavor region price created successfully' })
  message: string;

  @ApiProperty({ example: 201 })
  code: number;

  @ApiProperty({ type: FlavorRegionItemPriceResponseDto })
  data: FlavorRegionItemPriceResponseDto;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}
