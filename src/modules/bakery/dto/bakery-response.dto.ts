import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';

export class BakeryRegionDto {
  @ApiProperty({ example: MOCK_DATA.id.region })
  id: string;

  @ApiProperty({ example: MOCK_DATA.name.region })
  name: string;
}

export class BakeryDataDto {
  @ApiProperty({ example: MOCK_DATA.id.bakery })
  id: string;

  @ApiProperty({ example: MOCK_DATA.name.bakery })
  name: string;

  @ApiProperty({ example: '12 El-Maadi St, Cairo' })
  locationDescription: string;

  @ApiProperty({ example: MOCK_DATA.numbers.capacity })
  capacity: number;

  @ApiProperty({ example: MOCK_DATA.id.region })
  regionId: string;

  @ApiProperty({ type: [String], example: ['large_cakes', 'small_cakes'] })
  types: string[];

  @ApiProperty({ example: 4.5, nullable: true })
  averageRating: number;

  @ApiProperty({ example: 12 })
  totalReviews: number;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  createdAt: Date;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  updatedAt: Date;
}

export class SuccessBakeryResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Bakery retrieved successfully' })
  message: string;

  @ApiProperty({ type: BakeryDataDto })
  data: BakeryDataDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class SuccessBakeriesResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Bakeries retrieved successfully' })
  message: string;

  @ApiProperty({ type: [BakeryDataDto] })
  data: BakeryDataDto[];

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class BakeryItemStoreDataDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  id: string;

  @ApiProperty({ example: MOCK_DATA.id.bakery })
  bakeryId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  regionItemPriceId: string;

  @ApiProperty({ example: 50 })
  stock: number;

  @ApiProperty({ example: '150.00' })
  price: string;

  @ApiProperty({ example: { small: '100.00', medium: '150.00', large: '200.00' }, nullable: true })
  sizesPrices?: Record<string, string>;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440003', nullable: true })
  addonId?: string;

  @ApiProperty({ example: null, nullable: true })
  featuredCakeId?: string;

  @ApiProperty({ example: null, nullable: true })
  sweetId?: string;

  @ApiProperty({ example: null, nullable: true })
  decorationId?: string;

  @ApiProperty({ example: null, nullable: true })
  flavorId?: string;

  @ApiProperty({ example: null, nullable: true })
  shapeId?: string;

  @ApiProperty({ example: null, nullable: true })
  predesignedCakeId?: string;

  @ApiProperty({
    nullable: true,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Chocolate Sprinkles',
      description: 'Delicious chocolate sprinkles for cake decoration',
      images: ['https://example.com/sprinkles1.jpg'],
      type: 'addon',
    },
  })
  product?: {
    id: string;
    name: string;
    description: string;
    images: string[];
    type: 'addon' | 'sweet' | 'featured_cake';
  } | null;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  createdAt: Date;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  updatedAt: Date;
}

export class SuccessBakeryItemStoresResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Bakery item stores retrieved successfully' })
  message: string;

  @ApiProperty({ type: [BakeryItemStoreDataDto] })
  data: BakeryItemStoreDataDto[];

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}

export class SuccessBakeryItemStoreResponseDto {
  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Stock updated successfully' })
  message: string;

  @ApiProperty({ type: BakeryItemStoreDataDto })
  data: BakeryItemStoreDataDto;

  @ApiProperty({ example: MOCK_DATA.dates.default })
  timestamp: string;
}
