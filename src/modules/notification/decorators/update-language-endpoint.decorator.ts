import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateLanguageDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function UpdateLanguageDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update preferred language',
      description:
        'Sets the preferred language of the authenticated user or admin. Notifications are stored bilingually; ' +
        'this decides which side is delivered as the FCM push. Call it on login and whenever the app/dashboard ' +
        'language is switched.',
    }),
    ApiBody({
      type: UpdateLanguageDto,
      examples: {
        arabic: { summary: 'Switch to Arabic', value: { language: 'ar' } },
        english: { summary: 'Switch to English', value: { language: 'en' } },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Language updated successfully',
      example: {
        success: true,
        message: 'Language updated successfully',
        data: { language: 'ar' },
        statusCode: HttpStatus.OK,
      },
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Authentication required',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Authenticated user or admin no longer exists',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update language',
      type: ErrorResponseDto,
    }),
  );
}
