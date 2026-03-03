import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { OrderResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetAllOrdersDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all orders (admin)',
      description:
        'Retrieve all orders with optional filtering by region and/or status. Accessible to admin users only.',
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
    ApiQuery({
      name: 'page',
      required: false,
      type: Number,
      description: 'Page number for pagination (default: 1)',
      example: 1,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      type: Number,
      description: 'Number of items per page (default: 10)',
      example: 10,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Orders retrieved successfully',
      type: OrderResponseDto,
      isArray: true,
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
      description: 'Failed to retrieve orders due to server error',
      type: ErrorResponseDto,
    }),
  );
}
