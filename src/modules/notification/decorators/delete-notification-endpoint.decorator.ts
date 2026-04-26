import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessMessageResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { NotificationExamples } from '@/constants/examples';

export function DeleteNotificationDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete a notification',
      description:
        'Permanently delete a notification. Must belong to the authenticated user/admin.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the notification',
      example: 'dd0e8400-e29b-41d4-a716-446655440009',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Notification deleted successfully',
      type: SuccessMessageResponseDto,
      example: NotificationExamples.delete.response.success,
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
      description: 'Failed to delete notification',
      type: ErrorResponseDto,
    }),
  );
}
