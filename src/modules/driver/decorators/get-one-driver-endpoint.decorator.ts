import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DriverDataDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetOneDriverDecorator() {
  return applyDecorators(
    ApiOperation({ summary: 'Get driver by id', description: 'Retrieve driver details by id' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Driver retrieved', type: DriverDataDto }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Driver not found',
      type: ErrorResponseDto,
    }),
  );
}
