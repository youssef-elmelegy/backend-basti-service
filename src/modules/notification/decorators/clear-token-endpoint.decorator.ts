import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessMessageResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { NotificationExamples } from '@/constants/examples';

export function ClearFcmTokenDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Clear FCM device token',
      description:
        'Removes the FCM device token registered for the authenticated user or admin. Call this on logout so the backend stops targeting a device that should no longer receive push notifications.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'FCM token cleared successfully',
      type: SuccessMessageResponseDto,
      example: NotificationExamples.clearToken.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Authentication required',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to clear FCM token',
      type: ErrorResponseDto,
    }),
  );
}
