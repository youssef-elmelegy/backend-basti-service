import { ApiProperty } from '@nestjs/swagger';
import { MOCK_DATA } from '@/constants/global.constants';

export class FeaturedCakeDataDto {
  @ApiProperty({
    description: 'Featured cake unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Featured cake name',
    example: 'Chocolate Dream Cake',
  })
  name: string;

  @ApiProperty({
    description: 'Featured cake description',
    example: 'Delicious chocolate cake with rich ganache',
  })
  description: string;

  @ApiProperty({
    description: 'Array of featured cake image URLs',
    example: [
      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/featured-cakes/chocolate.jpg',
    ],
    type: [String],
  })
  images: string[];

  @ApiProperty({
    description: 'Price of the featured cake',
    example: '250.00',
  })
  price: string;

  @ApiProperty({
    description: 'Featured cake capacity (number of servings)',
    example: 12,
  })
  capacity: number;

  @ApiProperty({
    description: 'List of available flavors for this featured cake',
    example: ['Chocolate', 'Vanilla', 'Strawberry'],
    type: [String],
  })
  flavorList: string[];

  @ApiProperty({
    description: 'List of available piping palettes for this featured cake',
    example: ['Gold', 'Silver', 'Rose Gold'],
    type: [String],
  })
  pipingPaletteList: string[];

  @ApiProperty({
    description: 'Tag name associated with this featured cake',
    example: 'Premium',
  })
  tagName: string;

  @ApiProperty({
    description: 'Whether the featured cake is active and visible',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Featured cake creation timestamp',
    example: MOCK_DATA.dates.default,
  })
  createdAt: string;

  @ApiProperty({
    description: 'Featured cake last update timestamp',
    example: MOCK_DATA.dates.default,
  })
  updatedAt: string;
}

export class SuccessFeaturedCakeResponseDto {
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
    example: 'Cake created successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing featured cake',
    type: FeaturedCakeDataDto,
  })
  data: FeaturedCakeDataDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}

export class SuccessFeaturedCakesResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  code: number;

  @ApiProperty({
    description: 'Request success flag',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Cakes retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing featured cakes array',
    type: [FeaturedCakeDataDto],
  })
  data: FeaturedCakeDataDto[];

  @ApiProperty({
    description: 'Response timestamp',
    example: MOCK_DATA.dates.default,
  })
  timestamp: string;
}
