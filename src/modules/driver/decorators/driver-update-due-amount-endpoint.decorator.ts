import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AdminErrorResponseDto } from '@/modules/admin-auth/dto';
import { DriverDataDto, UpdateDriverDueAmountDto } from '../dto';

export function UpdateDriverDueAmountEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Update driver due amount',
      description: 'Update the due amount for a driver account.',
    }),
    ApiParam({ name: 'id', type: String, description: 'Driver ID (UUID)' }),
    ApiBody({ type: UpdateDriverDueAmountDto, description: 'Driver due amount update details' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Driver due amount updated successfully',
      type: DriverDataDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: AdminErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Driver not found',
      type: AdminErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: AdminErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions',
      type: AdminErrorResponseDto,
    }),
  );
}
