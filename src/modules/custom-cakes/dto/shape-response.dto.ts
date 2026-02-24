import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class ShapeDataDto {
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

  @ApiProperty({ example: 'medium', enum: ['small', 'medium', 'large'] })
  size: string;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  updatedAt: Date;

  @ApiProperty({ example: '50.00', required: false })
  price?: string;
}

export class SuccessShapeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Shape operation successful' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: ShapeDataDto;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class GetAllShapesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Shapes retrieved successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: ShapeDataDto[];

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}

export class DeleteShapeResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Shape deleted successfully' })
  message: string;

  @ApiProperty({ example: 200 })
  code: number;

  @ApiHideProperty()
  data: null;

  @ApiProperty({ example: '2024-02-07T10:00:00Z' })
  timestamp: string;
}
