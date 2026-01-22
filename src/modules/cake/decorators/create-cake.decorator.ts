import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateCakeDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { CakeExamples } from '@/constants/examples';

export function CreateCakeDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new cake',
      description:
        'Creates a new cake product with images, flavors, sizes, and pricing information.',
    }),
    ApiBody({
      type: CreateCakeDto,
      description:
        'Required: name, description, images, mainPrice, capacity, tags, flavors, sizes. Optional: isActive',
      examples: {
        success: {
          summary: 'Valid cake creation request',
          value: CakeExamples.create.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Cake successfully created',
      type: CreateCakeDto,
      example: CakeExamples.create.response.success,
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
      description: 'Failed to create cake due to server error',
      type: ErrorResponseDto,
    }),
  );
}
