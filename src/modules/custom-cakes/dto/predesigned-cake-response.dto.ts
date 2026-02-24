import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';

export class CakeConfigFlavorDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Chocolate' })
  title: string;

  @ApiProperty({ example: 'Rich chocolate flavor with smooth texture' })
  description: string;

  @ApiProperty({
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/flavors/chocolate.jpg',
  })
  flavorUrl: string;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  updatedAt: Date;
}

export class CakeConfigDecorationDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Red Roses' })
  title: string;

  @ApiProperty({ example: 'Beautiful red roses for cake decoration' })
  description: string;

  @ApiProperty({
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/basti/decorations/red-roses.jpg',
  })
  decorationUrl: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', required: false })
  tagId?: string;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  updatedAt: Date;
}

export class CakeConfigShapeDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Round' })
  title: string;

  @ApiProperty({ example: 'Classic round cake shape' })
  description: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/example/image/upload/v1234567890/basti/shapes/round.jpg',
  })
  shapeUrl: string;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  updatedAt: Date;
}

export class DesignedCakeConfigDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ type: () => CakeConfigFlavorDto })
  flavor: CakeConfigFlavorDto;

  @ApiProperty({ type: () => CakeConfigDecorationDto })
  decoration: CakeConfigDecorationDto;

  @ApiProperty({ type: () => CakeConfigShapeDto })
  shape: CakeConfigShapeDto;

  @ApiProperty({ example: '#FF0000' })
  frostColorValue: string;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  updatedAt: Date;
}

export class PredesignedCakeDataDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'Classic Chocolate Elegance' })
  name: string;

  @ApiProperty({ example: 'A beautiful chocolate cake with chocolate frosting' })
  description: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  tagId: string;

  @ApiProperty({
    example: 'Premium',
    nullable: true,
  })
  tagName: string;

  @ApiProperty({ type: () => [DesignedCakeConfigDto] })
  configs: DesignedCakeConfigDto[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  updatedAt: Date;
}

export class PaginatedPredesignedCakesDto {
  @ApiProperty({ type: [PredesignedCakeDataDto] })
  items: PredesignedCakeDataDto[];

  @ApiProperty({
    example: {
      total: 2,
      totalPages: 1,
      page: 1,
      limit: 10,
    },
  })
  pagination: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
}

export class PredesignedCakeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Predesigned cake operation successful' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ type: () => PredesignedCakeDataDto })
  data: PredesignedCakeDataDto;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class GetAllPredesignedCakesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Predesigned cakes retrieved successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ type: () => PaginatedPredesignedCakesDto })
  data: PaginatedPredesignedCakesDto;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class DeletePredesignedCakeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Predesigned cake deleted successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: null;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class EntityAvailabilityDto {
  @ApiProperty({ example: true })
  flavorAvailable: boolean;

  @ApiProperty({ example: true })
  shapeAvailable: boolean;

  @ApiProperty({ example: false })
  decorationAvailable: boolean;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  entityId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  regionId: string;
}

export class CheckEntityAvailabilityResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Entity availability checked successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiProperty({ type: () => EntityAvailabilityDto })
  data: EntityAvailabilityDto;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class RegionItemPriceDto {
  @ApiProperty({ example: '789e5678-f90c-12d4-b567-537765285000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', nullable: true })
  predesignedCakeId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  regionId: string;

  @ApiProperty({ example: '250.99' })
  price: string;

  @ApiProperty({ example: '2024-02-07T12:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-07T12:30:00Z' })
  updatedAt: Date;
}

export class RegionItemPriceResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Predesigned cake region price created successfully' })
  message: string;

  @ApiProperty({ example: 201 })
  code: number;

  @ApiProperty({ type: () => RegionItemPriceDto })
  data: RegionItemPriceDto;

  @ApiProperty({ example: '2024-02-07T12:30:00Z' })
  timestamp: string;
}
