import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class FlavorDataDto {
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

export class VariantImageDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/sliced.jpg',
  })
  slicedViewUrl: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/front.jpg',
  })
  frontViewUrl: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/example/image/upload/v1234567890/basti/views/top.jpg',
  })
  topViewUrl: string;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  updatedAt: Date;
}

export class VariantImageWithShapeDto extends VariantImageDto {
  @ApiProperty({ example: '223e4567-e89b-12d3-a456-426614174000', description: 'Shape ID' })
  shapeId: string;
}

export class GetFlavorVariantImagesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Flavor variant images retrieved successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: VariantImageWithShapeDto[];

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class FlavorWithVariantImagesDto extends FlavorDataDto {
  @ApiProperty({ type: [VariantImageDto], required: false })
  variantImages?: VariantImageDto[];

  @ApiProperty({ example: '100', required: false })
  price?: string;
}

export class PaginationDto {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 10 })
  totalPages: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

export class SuccessFlavorResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Flavor operation successful' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: FlavorDataDto;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class GetAllFlavorsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Flavors retrieved successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: {
    items: FlavorWithVariantImagesDto[];
    pagination: PaginationDto;
  };

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class DeleteFlavorResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Flavor deleted successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: null;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class FlavorConflictDataDto {
  @ApiProperty({
    example: 3,
    description: 'Number of designed cake configs that use this flavor',
  })
  relatedConfigsCount: number;

  @ApiProperty({
    example: 2,
    description: 'Number of predesigned cakes affected',
  })
  affectedPredesignedCakesCount: number;

  @ApiProperty({
    example: ['uuid-1', 'uuid-2'],
    description: 'IDs of affected predesigned cakes',
    type: [String],
  })
  affectedPredesignedCakeIds: string[];
}

export class DeleteFlavorConflictResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({
    example: 'Cannot delete flavor because it is used in predesigned cake configurations',
  })
  message: string;

  @ApiProperty({ example: 409 })
  code: number;

  @ApiProperty({ type: FlavorConflictDataDto })
  data: FlavorConflictDataDto;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}
