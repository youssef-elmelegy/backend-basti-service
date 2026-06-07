import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { SuccessDriversResponseDto } from '../dto';

export function GetAllDriversDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all drivers',
      description: 'Retrieves all admins that have the driver role.',
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
