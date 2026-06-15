import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateDriverDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function CreateDriverEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.CREATED),
    ApiOperation({
      summary: 'Create new driver',
      description: 'Create a new driver account. Accessible to super_admin users only.',
    }),
    ApiBody({ type: CreateDriverDto, description: 'Driver creation details' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Driver created successfully',
      type: CreateDriverDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or email already exists',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions (super_admin only)',
      type: ErrorResponseDto,
    }),
  );
}
