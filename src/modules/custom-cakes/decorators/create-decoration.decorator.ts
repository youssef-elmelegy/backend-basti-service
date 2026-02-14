import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateDecorationDto, SuccessDecorationResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { DecorationExamples } from '@/constants/examples';

export function CreateDecorationDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new decoration',
      description: 'Creates a new cake decoration with image URL and optional tag.',
    }),
    ApiBody({
      type: CreateDecorationDto,
      description: 'Required: title, description, decorationUrl. Optional: tagId',
      examples: {
        success: {
          summary: 'Valid decoration creation request',
          value: DecorationExamples.create.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Decoration successfully created',
      type: SuccessDecorationResponseDto,
      example: DecorationExamples.create.response.success,
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
      description: 'Failed to create decoration due to server error',
      type: ErrorResponseDto,
    }),
  );
}
