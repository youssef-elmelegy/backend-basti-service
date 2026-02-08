import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SuccessSliderImagesResponseDto, SliderImageItemDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

const updateRequestExample = [
  {
    title: 'Summer Collection',
    imageUrl: 'https://api.example.com/images/sliders/summer-collection.jpg',
  },
  {
    title: 'Winter Special',
    imageUrl: 'https://api.example.com/images/sliders/winter-special.jpg',
  },
];

export function UpdateSliderImagesDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Update slider images',
      description:
        'Updates the slider images by deleting all existing images and creating new ones with the provided titles and image URLs. This operation is performed in bulk for efficiency.',
    }),
    ApiBody({
      type: [SliderImageItemDto],
      description:
        'Array of slider images with title and URL to replace all existing slider images',
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
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed, empty array, or invalid URLs/titles)',
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
