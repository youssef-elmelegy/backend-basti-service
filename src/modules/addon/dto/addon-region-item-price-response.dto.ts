import { ApiProperty } from '@nestjs/swagger';

export class AddonRegionItemPriceDataDto {
  @ApiProperty({
    description: 'Add-on ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  addonId: string;

  @ApiProperty({
    description: 'Region ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  regionId: string;

  @ApiProperty({
    description: 'Price for the add-on in this region',
    example: '50',
  })
  price: string;

  @ApiProperty({
    description: 'Prices for different sizes in this region',
    example: { small: '30', medium: '50', large: '70' },
    nullable: true,
    required: false,
  })
  sizesPrices?: Record<string, string>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

export class SuccessAddonRegionItemPriceResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 201,
  })
  code: number;

  @ApiProperty({
    description: 'Request success flag',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Region pricing created successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing region pricing information',
    type: AddonRegionItemPriceDataDto,
  })
  data: AddonRegionItemPriceDataDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;
}
