import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { PaginationDto, VariantImageDto } from './flavor-response.dto';

export class DecorationDataDto {
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

  @ApiProperty({ example: 'Decorations', required: false })
  tagName?: string;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ type: [VariantImageDto], required: false })
  variantImages?: VariantImageDto[];

  @ApiProperty({ example: '500', required: false })
  price?: string;
}

export class SuccessDecorationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Decoration operation successful' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: DecorationDataDto;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class GetAllDecorationsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Decorations retrieved successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: {
    items: DecorationDataDto[];
    pagination: PaginationDto;
  };

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class DeleteDecorationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Decoration deleted successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: null;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}
