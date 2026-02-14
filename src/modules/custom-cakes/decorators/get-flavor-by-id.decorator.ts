import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessFlavorResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FlavorExamples } from '@/constants/examples';

export function GetFlavorByIdDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get flavor by ID',
      description: 'Retrieves a specific flavor by its ID.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Flavor successfully retrieved',
      type: SuccessFlavorResponseDto,
      example: FlavorExamples.getById.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Flavor not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid flavor ID format',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve flavor due to server error',
      type: ErrorResponseDto,
    }),
  );
}
