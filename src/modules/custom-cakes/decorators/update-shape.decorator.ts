import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UpdateShapeDto, SuccessShapeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { ShapeExamples } from '@/constants/examples';

export function UpdateShapeDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a shape',
      description: 'Updates an existing cake shape with new information.',
    }),
    ApiBody({
      type: UpdateShapeDto,
      description: 'All fields are optional',
      examples: {
        success: {
          summary: 'Valid shape update request',
          value: ShapeExamples.update.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Shape successfully updated',
      type: SuccessShapeResponseDto,
      example: ShapeExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Shape not found',
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
      description: 'Failed to update shape due to server error',
      type: ErrorResponseDto,
    }),
  );
}
