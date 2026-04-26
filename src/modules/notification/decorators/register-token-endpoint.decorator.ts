import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RegisterFcmTokenDto, SuccessMessageResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { NotificationExamples } from '@/constants/examples';

export function RegisterFcmTokenDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Register FCM device token',
      description:
        'Registers an FCM device token for the authenticated user or admin. The new token overwrites the previous one.',
    }),
    ApiBody({
      type: RegisterFcmTokenDto,
      examples: {
        success: {
          summary: 'Valid FCM token',
          value: NotificationExamples.registerToken.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'FCM token registered successfully',
      type: SuccessMessageResponseDto,
      example: NotificationExamples.registerToken.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Authentication required',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to register FCM token',
      type: ErrorResponseDto,
    }),
  );
}
