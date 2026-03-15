import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto, UpdateProfileDto } from '../dto';

export function AuthUpdateProfileDecorator() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Update user profile',
      description:
        'Updates the authenticated user profile information. Only provided fields will be updated.',
    }),
    ApiBody({
      type: UpdateProfileDto,
      description: 'Profile update data',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Profile updated successfully',
      schema: {
        example: {
          code: 200,
          success: true,
          message: 'Profile updated successfully',
          data: {
            message: 'Profile updated successfully',
            userId: '550e8400-e29b-41d4-a716-446655440000',
            updatedAt: '2025-01-11T10:05:00.000Z',
          },
          timestamp: '2025-01-11T10:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'User not authenticated',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
    }),
  );
}
