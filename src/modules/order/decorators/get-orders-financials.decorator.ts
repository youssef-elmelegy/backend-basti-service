import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { GetOrdersFinancialsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetOrdersFinancialsDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get orders financials',
      description:
        'Retrieve orders financials with optional filtering by bakery and delivered date range. Accessible to admin users only.',
    }),
    ApiQuery({
      name: 'bakeryId',
      required: false,
      type: String,
      description: 'Filter by bakery ID (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440001',
    }),
    ApiQuery({
      name: 'from',
      required: false,
      type: String,
      description: 'Filter orders delivered from this date (ISO string)',
      example: '2025-01-01',
    }),
    ApiQuery({
      name: 'to',
      required: false,
      type: String,
      description: 'Filter orders delivered up to this date (ISO string)',
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
      description: 'Orders financials retrieved successfully',
      type: GetOrdersFinancialsResponseDto,
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
      status: HttpStatus.NOT_FOUND,
      description: 'No financials found for the given filters',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve financials due to server error',
      type: ErrorResponseDto,
    }),
  );
}
