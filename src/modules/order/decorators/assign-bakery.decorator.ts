import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AssignBakeryDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function AssignBakeryDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Assign bakery to order',
      description: 'Assign a bakery to handle a specific order. Only accessible to admin users.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the order to assign',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: AssignBakeryDto,
      description: 'Payload containing the bakery ID to assign to the order',
      examples: {
        assign: {
          summary: 'Assign bakery request',
          value: {
            bakeryId: '550e8400-e29b-41d4-a716-446655440001',
          },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Bakery assigned to order successfully',
      example: {
        code: 200,
        success: true,
        message: 'Bakery assigned to order successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          bakeryId: '550e8400-e29b-41d4-a716-446655440001',
        },
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Order or bakery not found',
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
      description: 'Forbidden - insufficient permissions (admin only)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to assign bakery due to server error',
      type: ErrorResponseDto,
    }),
  );
}
