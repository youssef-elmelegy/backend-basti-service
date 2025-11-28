import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SuccessAuthResponseDto, ErrorResponseDto, SignupDto } from '../dto';
import { AuthExamples } from '@/constants/examples';

export function AuthSignupDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a new user',
      description:
        'Creates a new user account with email, password, and name. Password must be at least 8 characters with uppercase, lowercase, and numeric characters.',
    }),
    ApiBody({
      type: SignupDto,
      description: 'User registration data',
      examples: {
        success: {
          summary: 'Valid signup request',
          value: AuthExamples.signup.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'User successfully registered',
      type: SuccessAuthResponseDto,
      example: AuthExamples.signup.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
      example: AuthExamples.signup.response.validationError,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'User with this email already exists',
      type: ErrorResponseDto,
      example: AuthExamples.signup.response.conflict,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to create user due to server error',
      type: ErrorResponseDto,
      example: AuthExamples.signup.response.internalServerError,
    }),
  );
}
