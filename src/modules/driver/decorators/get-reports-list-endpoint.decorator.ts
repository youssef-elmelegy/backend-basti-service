import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { SuccessReportsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetReportsListDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all driver reports',
      description:
        'Paginated, sorted list of reports across all drivers, with reporter and driver info. Returns { items, pagination }.',
    }),
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
