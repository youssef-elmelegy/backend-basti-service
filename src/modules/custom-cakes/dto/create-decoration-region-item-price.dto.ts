import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDecorationRegionItemPriceDto {
  @ApiProperty({
    description: 'Region ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  regionId: string;

  @ApiProperty({
    description: 'Decoration ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  decorationId: string;

  @ApiProperty({
    description: 'Price for this decoration in the region',
    example: 8.99,
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

export class DecorationRegionItemPriceResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174003' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  regionId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  decorationId: string;

  @ApiProperty({ example: '8.99' })
  price: string;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  updatedAt: Date;
}

export class SuccessDecorationRegionItemPriceResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Decoration region price created successfully' })
  message: string;

  @ApiProperty({ example: 201 })
  code: number;

  @ApiProperty({ type: DecorationRegionItemPriceResponseDto })
  data: DecorationRegionItemPriceResponseDto;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}
