import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { AssignDriverDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function AssignDriverDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Assign or unassign driver',
      description:
        'Assign an order to a driver (admin with driver role) or unassign by sending null driverId.',
    }),
    ApiParam({
      name: 'id',
      type: String,
      description: 'Order ID (UUID)',
      example: '990e8400-e29b-41d4-a716-446655440010',
    }),
    ApiBody({ type: AssignDriverDto, description: 'Driver assignment payload' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Driver assignment updated successfully' }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Order or driver not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
      type: ErrorResponseDto,
    }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ErrorResponseDto }),
  );
}
