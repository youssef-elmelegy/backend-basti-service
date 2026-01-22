import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorResponseDto, LogoutResponseWrapperDto } from '../dto';

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
      type: LogoutResponseWrapperDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Invalid or missing access token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during logout',
      type: ErrorResponseDto,
    }),
  );
}
