import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SuccessLogoutResponseDto, ErrorResponseDto } from '../dto';
import { AuthExamples } from '@/constants/examples';

export function AuthLogoutDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Logout user',
      description:
        'Logs out the currently authenticated user. Requires a valid access token. Client should delete tokens from local storage.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'User successfully logged out',
      type: SuccessLogoutResponseDto,
      example: AuthExamples.logout.response.success,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or missing access token',
      type: ErrorResponseDto,
      example: AuthExamples.logout.response.unauthorized,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Token is expired or revoked',
      type: ErrorResponseDto,
      example: AuthExamples.logout.response.forbidden,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during logout',
      type: ErrorResponseDto,
      example: AuthExamples.logout.response.internalServerError,
    }),
  );
}
