import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SuccessSliderImagesResponseDto, SliderImageItemDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

const updateRequestExample = [
  {
    title: 'Summer Collection',
    imageUrl: 'https://api.example.com/images/sliders/summer-collection.jpg',
    displayOrder: 1,
  },
  {
    title: 'Winter Special',
    imageUrl: 'https://api.example.com/images/sliders/winter-special.jpg',
    displayOrder: 2,
  },
];

const updateResponseExample = {
  code: 200,
  success: true,
  message: 'Slider images updated successfully',
  data: [
    {
      id: 'bb0e8400-e29b-41d4-a716-446655440007',
      title: 'Summer Collection',
      imageUrl: 'https://api.example.com/images/sliders/summer-collection.jpg',
      displayOrder: 1,
      createdAt: '2025-11-27T10:00:00.000Z',
    },
    {
      id: 'bb0e8400-e29b-41d4-a716-446655440008',
      title: 'Winter Special',
      imageUrl: 'https://api.example.com/images/sliders/winter-special.jpg',
      displayOrder: 2,
      createdAt: '2025-11-27T10:05:00.000Z',
    },
  ],
  timestamp: '2025-11-27T10:10:00.000Z',
};

export function UpdateSliderImagesDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Update slider images',
      description:
        'Updates the slider images by deleting all existing images and creating new ones with the provided titles, image URLs, and display order. This operation is performed in bulk for efficiency.',
    }),
    ApiBody({
      type: [SliderImageItemDto],
      description:
        'Array of slider images with title, URL, and display order to replace all existing slider images',
      examples: {
        success: {
          summary: 'Valid slider images update request',
          value: updateRequestExample,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Slider images successfully updated',
      type: SuccessSliderImagesResponseDto,
      example: updateResponseExample,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description:
        'Invalid input data (validation failed, empty array, invalid URLs/titles, or invalid displayOrder)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - Admin authentication required',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - Insufficient permissions (admin role required)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update slider images due to server error',
      type: ErrorResponseDto,
    }),
  );
}
