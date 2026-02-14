import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateShapeDto, SuccessShapeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { ShapeExamples } from '@/constants/examples';

export function CreateShapeDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new shape',
      description: 'Creates a new cake shape with image URL and optional tag.',
    }),
    ApiBody({
      type: CreateShapeDto,
      description: 'Required: title, description, shapeUrl',
      examples: {
        success: {
          summary: 'Valid shape creation request',
          value: ShapeExamples.create.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Shape successfully created',
      type: SuccessShapeResponseDto,
      example: ShapeExamples.create.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
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
      description: 'Failed to create shape due to server error',
      type: ErrorResponseDto,
    }),
  );
}
