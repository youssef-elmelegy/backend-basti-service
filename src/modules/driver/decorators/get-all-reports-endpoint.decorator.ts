import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessReportsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetAllReportsDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all reports for a driver',
      description: 'Retrieve all reports for a specific driver with reporter info',
    }),
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
