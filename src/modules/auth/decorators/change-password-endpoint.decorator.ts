import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ChangePasswordDto, ErrorResponseDto } from '../dto';

export function AuthChangePasswordDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Change user password',
      description: 'Allows authenticated users to change their password.',
    }),
    ApiBody({
      type: ChangePasswordDto,
      description: 'New password',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Password successfully changed',
      schema: {
        example: {
          data: {
            message: 'Password changed successfully',
          },
          statusCode: 200,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'User not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Server error during password change',
      type: ErrorResponseDto,
    }),
  );
}
