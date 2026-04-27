import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessUnreadCountResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { NotificationExamples } from '@/constants/examples';

export function UnreadCountDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get unread notifications count',
      description: 'Returns the number of unread notifications for the authenticated user/admin.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Unread count retrieved successfully',
      type: SuccessUnreadCountResponseDto,
      example: NotificationExamples.unreadCount.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Authentication required',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve unread count',
      type: ErrorResponseDto,
    }),
  );
}
