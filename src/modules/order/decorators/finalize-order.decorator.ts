import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FinalizeOrderDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function FinalizeOrderDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Finalize order QA',
      description:
        'Finalize an order by submitting QA data including final image URLs and optional notes. Only accessible to admin users.',
    }),
    ApiParam({
      name: 'orderId',
      type: 'string',
      description: 'The UUID of the order to finalize',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: FinalizeOrderDto,
      description: 'Payload containing bakery ID and QA details for finalizing an order',
      examples: {
        finalize: {
          summary: 'Finalize order QA request',
          value: {
            bakeryId: '550e8400-e29b-41d4-a716-446655440001',
            finalImages: ['https://cdn.example.com/orders/final-1.jpg'],
            notes: ['Looks good.'],
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Order finalized successfully',
      example: {
        code: 200,
        success: true,
        message: 'Order finalized successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          bakeryId: '550e8400-e29b-41d4-a716-446655440001',
          qa: {
            finalImages: ['https://cdn.example.com/orders/final-1.jpg'],
            notes: ['Looks good.'],
          },
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Order not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data, invalid order state, or bakery mismatch',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to finalize order due to server error',
      type: ErrorResponseDto,
    }),
  );
}
