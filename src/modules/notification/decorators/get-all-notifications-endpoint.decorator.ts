import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SuccessNotificationsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { NotificationExamples } from '@/constants/examples';
import { NOTIFICATION_TYPES } from '../dto/send-notification.dto';

export function GetAllNotificationsDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get current recipient notifications (paginated)',
      description:
        'Retrieves a paginated list of notifications for the authenticated user or admin, ordered by creation date (newest first).',
    }),
    ApiQuery({
      name: 'isRead',
      required: false,
      type: Boolean,
      description: 'Filter by read status (true = read, false = unread). Omit for all.',
    }),
    ApiQuery({
      name: 'type',
      required: false,
      enum: NOTIFICATION_TYPES,
      description: 'Filter by notification type',
    }),
    ApiQuery({
      name: 'actionRequired',
      required: false,
      type: Boolean,
      description:
        'When true, returns only notifications that need admin action. Takes precedence over `type`.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Notifications retrieved successfully',
      type: SuccessNotificationsResponseDto,
      example: NotificationExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Authentication required',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve notifications',
      type: ErrorResponseDto,
    }),
  );
}
