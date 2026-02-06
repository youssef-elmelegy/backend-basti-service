import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function CancelOrderDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Cancel an order',
      description:
        'Cancel an existing order that belongs to the authenticated user. Only orders in a cancellable state (e.g. pending) can be cancelled.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the order to cancel',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Order cancelled successfully',
      example: {
        code: 200,
        success: true,
        message: 'Order cancelled successfully',
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
      status: HttpStatus.BAD_REQUEST,
      description: 'Order cannot be cancelled (invalid status or request)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to cancel order due to server error',
      type: ErrorResponseDto,
    }),
  );
}
