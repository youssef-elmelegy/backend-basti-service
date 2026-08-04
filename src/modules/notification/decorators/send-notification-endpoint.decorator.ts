import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SendNotificationDto, SuccessNotificationResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { NotificationExamples } from '@/constants/examples';

export function SendNotificationDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Send a notification (PUBLIC — for testing)',
      description:
        'Persists a notification row for the target recipient (user or admin) and pushes it via FCM if a device token is registered. Currently public for testing.',
    }),
    ApiBody({
      type: SendNotificationDto,
      examples: {
        success: {
          summary: 'Send order status notification to a user',
          value: NotificationExamples.send.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Notification sent successfully',
      type: SuccessNotificationResponseDto,
      example: NotificationExamples.send.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Recipient (user or admin) not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to send notification',
      type: ErrorResponseDto,
    }),
  );
}
