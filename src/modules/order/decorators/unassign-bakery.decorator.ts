import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UnassignBakeryDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function UnassignBakeryDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Unassign order from bakery',
      description:
        'Remove an order from its currently assigned bakery. Admin and bakery staff can use this endpoint.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the order to unassign',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UnassignBakeryDto,
      description: 'Optional payload containing the reason for unassignment',
      required: false,
      examples: {
        withReason: {
          summary: 'Unassign with reason',
          value: {
            reason: 'Bakery capacity exceeded',
          },
        },
        withoutReason: {
          summary: 'Unassign without reason',
          value: {},
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Order successfully unassigned from bakery',
      example: {
        code: 200,
        success: true,
        message: 'Order unassigned from bakery successfully',
        data: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          bakeryId: null,
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
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - Invalid or missing authentication token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - User does not have permission to unassign orders',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Internal server error - Failed to unassign order',
      type: ErrorResponseDto,
    }),
  );
}
