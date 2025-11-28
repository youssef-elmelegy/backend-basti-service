import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SuccessAuthResponseDto, ErrorResponseDto, LoginDto } from '../dto';
import { AuthExamples } from '@/constants/examples';

export function AuthLoginDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Login user',
      description:
        'Authenticates a user with email and password. Returns access token, refresh token, and user information.',
    }),
    ApiBody({
      type: LoginDto,
      description: 'User login credentials',
      examples: {
        success: {
          summary: 'Valid login request',
          value: AuthExamples.login.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User successfully logged in',
      type: SuccessAuthResponseDto,
      example: AuthExamples.login.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
      example: AuthExamples.login.response.validationError,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid credentials (user not found or wrong password)',
      type: ErrorResponseDto,
      example: AuthExamples.login.response.unauthorized,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during authentication',
      type: ErrorResponseDto,
      example: AuthExamples.login.response.internalServerError,
    }),
  );
}
