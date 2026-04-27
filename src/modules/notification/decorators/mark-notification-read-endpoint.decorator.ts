import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessNotificationResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { NotificationExamples } from '@/constants/examples';

export function MarkNotificationReadDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Mark a notification as read',
      description:
        'Marks a single notification as read. The notification must belong to the authenticated user/admin.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the notification',
      example: 'dd0e8400-e29b-41d4-a716-446655440009',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Notification marked as read',
      type: SuccessNotificationResponseDto,
      example: NotificationExamples.markRead.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Authentication required',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Notification does not belong to the authenticated recipient',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Notification not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to mark notification as read',
      type: ErrorResponseDto,
    }),
  );
}
