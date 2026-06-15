import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { GetOrdersFinancialsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetBakeryFinancialsDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get bakery financials',
      description:
        'Retrieve financials for a single bakery, scoped to the bakery manager view. ' +
        'Includes orders from "ready" through "delivered" and filters the from/to range ' +
        'on the order creation date. Accessible to super_admin, admin and the bakery manager.',
    }),
    ApiParam({
      name: 'bakeryId',
      required: true,
      type: String,
      description: 'Bakery ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiQuery({
      name: 'from',
      required: false,
      type: String,
      description: 'Filter orders created from this date (ISO string)',
      example: '2025-01-01',
    }),
    ApiQuery({
      name: 'to',
      required: false,
      type: String,
      description: 'Filter orders created up to this date (ISO string)',
      example: '2025-01-31',
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
      description: 'Bakery financials retrieved successfully',
      type: GetOrdersFinancialsResponseDto,
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
      status: HttpStatus.NOT_FOUND,
      description: 'Bakery not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve financials due to server error',
      type: ErrorResponseDto,
    }),
  );
}
