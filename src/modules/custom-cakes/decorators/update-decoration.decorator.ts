import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdateDecorationDto, SuccessDecorationResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { DecorationExamples } from '@/constants/examples';

export function UpdateDecorationDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a decoration',
      description: 'Updates an existing decoration with new information.',
    }),
    ApiBody({
      type: UpdateDecorationDto,
      description: 'All fields are optional',
      examples: {
        success: {
          summary: 'Valid decoration update request',
          value: DecorationExamples.update.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Decoration successfully updated',
      type: SuccessDecorationResponseDto,
      example: DecorationExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Decoration not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update decoration due to server error',
      type: ErrorResponseDto,
    }),
  );
}
