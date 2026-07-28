import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import {
  ErrorResponseDto,
  LoginDto,
  AuthResponseWrapperDto,
  ProfileSetupRequiredResponseWrapperDto,
} from '../dto';
import { AuthExamples } from '@/constants/examples';

export function AuthLoginDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiExtraModels(AuthResponseWrapperDto, ProfileSetupRequiredResponseWrapperDto),
    ApiOperation({
      summary: 'Login user',
      description:
        'Authenticates a user with email and password.\n\n' +
        'Returns one of two 200 responses:\n' +
        '- **Logged in**: access token, refresh token, and user information.\n' +
        '- **Profile setup required**: when the account is verified but the profile is ' +
        'incomplete (no phone number), returns `profileSetupRequired: true` and a short-lived ' +
        '`tempToken` instead of the token pair. The client should route the user to profile ' +
        'setup and send that token as `Authorization: Bearer <tempToken>` to `POST /auth/setup-profile`, ' +
        'which returns the real access and refresh tokens.\n\n' +
        'Clients must branch on `data.profileSetupRequired` before assuming a session exists.',
    }),
    ApiBody({
      type: LoginDto,
      description: 'User login credentials',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description:
        'User successfully logged in, or authenticated but pending profile setup. ' +
        'Check `data.profileSetupRequired` to tell the two apart.',
      schema: {
        oneOf: [
          { $ref: getSchemaPath(AuthResponseWrapperDto) },
          { $ref: getSchemaPath(ProfileSetupRequiredResponseWrapperDto) },
        ],
      },
      examples: {
        loggedIn: {
          summary: 'Logged in',
          value: AuthExamples.login.response.success,
        },
        profileSetupRequired: {
          summary: 'Profile setup required',
          value: AuthExamples.login.response.profileSetupRequired,
        },
      },
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
      status: HttpStatus.FORBIDDEN,
      description: 'Email not verified. The user must verify their email via OTP before logging in',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during authentication',
      type: ErrorResponseDto,
    }),
  );
}
