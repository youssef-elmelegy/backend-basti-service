import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { SuccessDriversResponseDto } from '../dto';

export function GetAllDriversDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all drivers',
      description:
        'Paginated list of admins with the driver role. Supports search (q), blocked filter, and region filter. Returns { items, pagination }.',
    }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({
      name: 'q',
      required: false,
      type: String,
      description: 'Search by name, email or phone number',
    }),
    ApiQuery({
      name: 'isBlocked',
      required: false,
      type: Boolean,
      description: 'Filter by blocked (banned) state',
    }),
    ApiQuery({
      name: 'regionId',
      required: false,
      type: String,
      description: 'Filter by region (UUID)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Drivers retrieved successfully',
      type: SuccessDriversResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Authentication required',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Insufficient permissions',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve drivers',
      type: ErrorResponseDto,
    }),
  );
}
