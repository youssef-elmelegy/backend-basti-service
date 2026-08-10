import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ChangeSliderImageOrderDto, SuccessSliderImagesResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

const changeOrderResponseExample = {
  code: 200,
  success: true,
  message: 'Slider image order updated successfully',
  data: [
    {
      id: 'bb0e8400-e29b-41d4-a716-446655440008',
      title: 'Winter Special',
      imageUrl: 'https://api.example.com/images/sliders/winter-special.jpg',
      displayOrder: 1,
      createdAt: '2025-11-27T10:05:00.000Z',
    },
    {
      id: 'bb0e8400-e29b-41d4-a716-446655440007',
      title: 'Summer Collection',
      imageUrl: 'https://api.example.com/images/sliders/summer-collection.jpg',
      displayOrder: 2,
      createdAt: '2025-11-27T10:00:00.000Z',
    },
  ],
  timestamp: '2025-11-27T10:10:00.000Z',
};

export function ChangeSliderImageOrderDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change slider image order',
      description:
        'Moves a slider image to a new display order position. The remaining images shift to close the gap, and the whole set is renumbered sequentially from 1. Returns all slider images sorted by display order.',
    }),
    ApiParam({
      name: 'id',
      description: 'Slider image ID (UUID)',
      example: 'bb0e8400-e29b-41d4-a716-446655440007',
    }),
    ApiBody({
      type: ChangeSliderImageOrderDto,
      description: 'New display order position for the slider image',
      examples: {
        success: {
          summary: 'Valid slider image order change request',
          value: { displayOrder: 1 },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        'Slider image order successfully changed, returns all slider images sorted by display order',
      type: SuccessSliderImagesResponseDto,
      example: changeOrderResponseExample,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid display order position',
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
      status: HttpStatus.NOT_FOUND,
      description: 'Slider image not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to change slider image order due to server error',
      type: ErrorResponseDto,
    }),
  );
}
