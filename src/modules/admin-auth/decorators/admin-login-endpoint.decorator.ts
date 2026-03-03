import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiHeader } from '@nestjs/swagger';
import { AdminLoginDto } from '../dto';
import { SuccessAdminLoginResponseDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminLoginEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiHeader({
      name: 'x-client-type',
      description:
        'Client type identifier. Use "mobile" for mobile clients to receive tokens in response instead of cookies.',
      required: false,
      example: 'mobile',
    }),
    ApiOperation({
      summary: 'Admin Login',
      description:
        'Authenticate admin with email and password. For web clients, tokens are stored in HTTP-only cookies. For mobile clients (header: x-client-type=mobile), tokens are returned in the response body.',
    }),
    ApiBody({
      type: AdminLoginDto,
      description: 'Admin login credentials',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Admin logged in successfully',
      type: SuccessAdminLoginResponseDto,
      example: AdminAuthExamples.login.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid credentials or admin account is blocked',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.login.response.unauthorized,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.login.response.validationError,
    }),
  );
}
