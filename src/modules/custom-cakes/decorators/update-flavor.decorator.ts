import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdateFlavorDto, SuccessFlavorResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FlavorExamples } from '@/constants/examples';

export function UpdateFlavorDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a flavor',
      description: 'Updates an existing flavor with new information.',
    }),
    ApiBody({
      type: UpdateFlavorDto,
      description: 'All fields are optional',
      examples: {
        success: {
          summary: 'Valid flavor update request',
          value: FlavorExamples.update.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Flavor successfully updated',
      type: SuccessFlavorResponseDto,
      example: FlavorExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Flavor not found',
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
      description: 'Failed to update flavor due to server error',
      type: ErrorResponseDto,
    }),
  );
}
