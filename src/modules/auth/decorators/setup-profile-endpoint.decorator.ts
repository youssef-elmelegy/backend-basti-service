import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto, SetupProfileDto, SetupProfileResponseWrapperDto } from '../dto';

export function AuthSetupProfileDecorator() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Complete user profile setup',
      description:
        'Completes the user profile setup with phone number and profile image after email verification. ' +
        'Returns access and refresh tokens upon successful setup.\n\n' +
        'Accepts either the `tempToken` issued by `POST /auth/verify-otp` or the one returned by ' +
        '`POST /auth/login` when the profile is incomplete.\n\n' +
        'The phone number must not already belong to another account, otherwise a 409 is returned.',
    }),
    ApiBody({
      type: SetupProfileDto,
      description: 'Profile setup data',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Profile setup completed successfully',
      type: SetupProfileResponseWrapperDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'User not authenticated or email not verified',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Phone number is already registered to another account',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error',
      type: ErrorResponseDto,
    }),
  );
}
