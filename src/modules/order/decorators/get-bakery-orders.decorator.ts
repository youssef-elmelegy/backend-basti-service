import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { OrderResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetBakeryOrdersDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get orders assigned to a bakery',
      description:
        'Retrieve all orders assigned to a specific bakery with optional filtering by region and/or status. Accessible to bakery staff and admin users only.',
    }),
    ApiParam({
      name: 'bakeryId',
      required: true,
      type: String,
      description: 'The UUID of the bakery',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiQuery({
      name: 'regionId',
      required: false,
      type: String,
      description: 'Filter orders by region ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      type: String,
      description:
        'Filter orders by status. Can be a single status or comma-separated multiple statuses (pending, confirmed, preparing, ready, out_for_delivery, delivered, cancelled)',
      example: 'pending,confirmed',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Bakery orders retrieved successfully',
      type: OrderResponseDto,
      isArray: true,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - User is not authenticated',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - User does not have required permissions',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Bakery not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve orders',
      type: ErrorResponseDto,
    }),
  );
}
