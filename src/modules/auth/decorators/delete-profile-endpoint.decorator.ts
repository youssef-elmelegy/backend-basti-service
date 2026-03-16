import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto, DeleteProfileDto } from '../dto';

export function AuthDeleteProfileDecorator() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Delete user account',
      description:
        'Permanently deletes the authenticated user account. Requires password verification for security.',
    }),
    ApiBody({
      type: DeleteProfileDto,
      description: 'Password verification for account deletion',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Account deleted successfully',
      schema: {
        example: {
          code: 200,
          success: true,
          message: 'Account deleted successfully',
          data: {
            message: 'Account deleted successfully',
            email: 'user@example.com',
            deletedAt: '2025-01-11T10:05:00.000Z',
          },
          timestamp: '2025-01-11T10:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'User not authenticated or invalid password',
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
