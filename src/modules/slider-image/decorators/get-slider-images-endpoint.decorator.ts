import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessSliderImagesWithTagsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

const getResponseExample = {
  code: 200,
  success: true,
  message: 'Slider images retrieved successfully',
  data: [
    {
      id: 'bb0e8400-e29b-41d4-a716-446655440007',
      title: 'Summer Collection',
      imageUrl: 'https://api.example.com/images/sliders/summer-collection.jpg',
      displayOrder: 1,
      createdAt: '2025-11-27T10:00:00.000Z',
      tags: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'summer',
          displayOrder: 1,
          createdAt: '2025-11-27T09:00:00.000Z',
          updatedAt: '2025-11-27T09:00:00.000Z',
        },
      ],
    },
    {
      id: 'bb0e8400-e29b-41d4-a716-446655440008',
      title: 'Winter Special',
      imageUrl: 'https://api.example.com/images/sliders/winter-special.jpg',
      displayOrder: 2,
      createdAt: '2025-11-27T10:05:00.000Z',
      tags: [],
    },
  ],
  timestamp: '2025-11-27T10:10:00.000Z',
};

export function GetSliderImagesDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get all slider images',
      description:
        'Retrieves all slider images displayed in the application slider/carousel, each with associated tags that share the same display order.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Slider images successfully retrieved',
      type: SuccessSliderImagesWithTagsResponseDto,
      example: getResponseExample,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve slider images due to server error',
      type: ErrorResponseDto,
    }),
  );
}
