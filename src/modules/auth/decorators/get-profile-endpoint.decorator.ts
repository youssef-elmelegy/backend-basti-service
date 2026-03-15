import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto } from '../dto';

export function AuthGetProfileDecorator() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Get user profile',
      description: 'Retrieves the authenticated user profile information.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User profile retrieved successfully',
      schema: {
        example: {
          code: 200,
          success: true,
          message: 'Profile retrieved successfully',
          data: {
            id: '550e8400-e29b-41d4-a716-446655440000',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phoneNumber: '+1234567890',
            profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
            isEmailVerified: true,
            createdAt: '2025-01-11T10:00:00.000Z',
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
