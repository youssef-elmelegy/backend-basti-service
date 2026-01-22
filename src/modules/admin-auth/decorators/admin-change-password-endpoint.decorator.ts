import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AdminChangePasswordDto } from '../dto';
import { SuccessAdminChangePasswordResponseDto, AdminErrorResponseDto } from '../dto';
import { AdminAuthExamples } from '@/constants/examples';

export function AdminChangePasswordEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Change Password',
      description:
        'Change admin password. Requires valid access token and current password verification.',
    }),
    ApiBody({
      type: AdminChangePasswordDto,
      description: 'Current password and new password with confirmation',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Password changed successfully',
      type: SuccessAdminChangePasswordResponseDto,
      example: AdminAuthExamples.changePassword.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error or passwords do not match',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.changePassword.response.passwordMismatch,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - invalid current password or invalid token',
      type: AdminErrorResponseDto,
      example: AdminAuthExamples.changePassword.response.invalidCurrentPassword,
    }),
  );
}
