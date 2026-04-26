import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessMessageResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { NotificationExamples } from '@/constants/examples';

export function MarkAllReadDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Mark all notifications as read',
      description: "Marks all of the authenticated recipient's unread notifications as read.",
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'All notifications marked as read',
      type: SuccessMessageResponseDto,
      example: NotificationExamples.markAllRead.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Authentication required',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to mark notifications as read',
      type: ErrorResponseDto,
    }),
  );
}
