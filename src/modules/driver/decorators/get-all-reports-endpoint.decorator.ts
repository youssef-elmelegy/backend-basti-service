import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessReportsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetAllReportsDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get reports for a driver',
      description:
        'Paginated, sorted reports for a specific driver with reporter info. Returns { items, pagination }.',
    }),
    ApiParam({ name: 'id', type: String, description: 'Driver ID (UUID)' }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({ name: 'q', required: false, type: String, description: 'Search report body' }),
    ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'], description: 'Sort by date' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Reports retrieved',
      type: SuccessReportsResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
      type: ErrorResponseDto,
    }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ErrorResponseDto }),
  );
}
