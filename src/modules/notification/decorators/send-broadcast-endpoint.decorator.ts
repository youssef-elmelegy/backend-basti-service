import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { BroadcastNotificationDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function SendBroadcastNotificationDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Broadcast a notification to all users',
      description:
        'Persists one notification row per user and pushes it via FCM to every user with a registered token. Returns aggregate counts.',
    }),
    ApiBody({
      type: BroadcastNotificationDto,
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Broadcast sent successfully',
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to send broadcast notification',
      type: ErrorResponseDto,
    }),
  );
}
