import { ApiProperty } from '@nestjs/swagger';

export class SweetRegionItemPriceDataDto {
  @ApiProperty({
    description: 'Sweet ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  sweetId: string;

  @ApiProperty({
    description: 'Region ID',
    example: '660f9500-f39c-51e5-b826-557766551111',
  })
  regionId: string;

  @ApiProperty({
    description: 'Price in EGP',
    example: '150.00',
  })
  price: string;

  @ApiProperty({
    description: 'Prices for each size',
    example: { Small: '100.00', Large: '200.00' },
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

export class SuccessSweetRegionItemPriceResponseDto {
  @ApiProperty()
  code: number;

  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: SweetRegionItemPriceDataDto;

  @ApiProperty()
  timestamp: string;
}
