import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ErrorResponseDto, SignupDto, SignupResponseWrapperDto } from '../dto';
import { AuthExamples } from '@/constants/examples';

export function AuthSignupDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Register a new user and send OTP',
      description:
        'Creates a new user account and sends an OTP to their email for verification. Password must be at least 8 characters with uppercase, lowercase, and numeric characters.',
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
      description: 'User registered successfully, OTP sent to email',
      type: SignupResponseWrapperDto,
      example: AuthExamples.signup.response.success,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Email already exists',
      type: ErrorResponseDto,
      example: AuthExamples.signup.response.conflict,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ErrorResponseDto,
      example: AuthExamples.signup.response.validationError,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
      example: AuthExamples.signup.response.internalServerError,
    }),
  );
}
