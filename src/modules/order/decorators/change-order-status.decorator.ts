import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ChangeOrderStatusDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function ChangeOrderStatusDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Change order status',
      description:
        'Update the status of an existing order. Typically used by admins to progress an order through its lifecycle.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the order to update',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: ChangeOrderStatusDto,
      description: 'Payload containing the new status for the order',
      examples: {
        change: {
          summary: 'Change order status request',
          value: {
            status: 'confirmed',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Order status updated successfully',
      example: {
        code: 200,
        success: true,
        message: 'Order status updated successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          status: 'confirmed',
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
      description: 'Invalid input data (validation failed)',
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
      description: 'Failed to change order status due to server error',
      type: ErrorResponseDto,
    }),
  );
}
