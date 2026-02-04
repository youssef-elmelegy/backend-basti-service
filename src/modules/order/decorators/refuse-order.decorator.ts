import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function RefuseOrderDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Refuse (cancel) an order',
      description:
        'Admin endpoint to refuse an order. This marks the order as cancelled and prevents further processing.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the order to refuse',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Order refused (cancelled) successfully',
      example: {
        code: 200,
        success: true,
        message: 'Order refused successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'cancelled',
        },
        timestamp: new Date().toISOString(),
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Order not found',
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
      description: 'Failed to refuse order due to server error',
      type: ErrorResponseDto,
    }),
  );
}
