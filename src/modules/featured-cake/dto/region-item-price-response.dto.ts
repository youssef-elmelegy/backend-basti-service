import { ApiProperty } from '@nestjs/swagger';

export class RegionItemPriceDataDto {
  @ApiProperty({
    description: 'Featured cake ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  featuredCakeId: string;

  @ApiProperty({
    description: 'Region ID',
    example: '660f9500-f39c-51e5-b826-557766551111',
  })
  regionId: string;

  @ApiProperty({
    description: 'Price in EGP',
    example: '1500.00',
  })
  price: string;

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

export class SuccessRegionItemPriceResponseDto {
  @ApiProperty()
  code: number;

  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: RegionItemPriceDataDto;

  @ApiProperty()
  timestamp: string;
}
