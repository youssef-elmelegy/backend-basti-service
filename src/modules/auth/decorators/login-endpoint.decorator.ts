import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ErrorResponseDto, LoginDto, AuthResponseWrapperDto } from '../dto';

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
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User successfully logged in',
      type: AuthResponseWrapperDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid credentials (user not found or wrong password)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during authentication',
      type: ErrorResponseDto,
    }),
  );
}
