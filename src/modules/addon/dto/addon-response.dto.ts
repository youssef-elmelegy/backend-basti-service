import { ApiProperty } from '@nestjs/swagger';

export class AddonDataDto {
  @ApiProperty({
    description: 'Add-on unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Add-on name',
    example: 'Extra Chocolate Frosting',
  })
  name: string;

  @ApiProperty({
    description: 'Add-on description',
    example: 'Rich chocolate frosting for extra flavor',
  })
  description: string;

  @ApiProperty({
    description: 'Array of add-on image URLs',
    example: [
      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/addons/frosting.jpg',
    ],
    type: [String],
  })
  images: string[];

  @ApiProperty({
    description: 'Add-on category',
    example: 'balloons',
    enum: ['balloons', 'cards', 'candles', 'decorations', 'other'],
  })
  category: string;

  @ApiProperty({
    description: 'Tag ID associated with this add-on',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  tagId: string;

  @ApiProperty({
    description: 'Tag name associated with this add-on',
    example: 'Premium',
    nullable: true,
  })
  tagName: string;

  @ApiProperty({
    description: 'Price for a specific region',
    example: '50',
    nullable: true,
    required: false,
  })
  price?: string;

  @ApiProperty({
    description: 'Prices for different sizes in a specific region',
    example: { small: '30', medium: '50', large: '70' },
    nullable: true,
    required: false,
  })
  sizesPrices?: Record<string, string>;

  @ApiProperty({
    description: 'Whether the add-on is active and visible',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Add-on creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Add-on last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;
}

export class SuccessAddonResponseDto {
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
    example: 'Add-on created successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing add-on',
    type: AddonDataDto,
  })
  data: AddonDataDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;
}

export class PaginationDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;
}

export class AddonsDataWithPaginationDto {
  @ApiProperty({
    description: 'Array of add-ons',
    type: [AddonDataDto],
  })
  items: AddonDataDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PaginationDto,
  })
  pagination: PaginationDto;
}

export class SuccessAddonsResponseDto {
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
    example: 'Add-ons retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data containing add-ons array and pagination',
    type: AddonsDataWithPaginationDto,
  })
  data: AddonsDataWithPaginationDto;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  timestamp: string;
}
