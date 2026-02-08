import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateSweetDto, SuccessSweetResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { SweetExamples } from '@/constants/examples';

const examples = SweetExamples as unknown as any;

export function CreateSweetDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new sweet',
      description: 'Creates a new sweet product with images and available sizes.',
    }),
    ApiBody({
      type: CreateSweetDto,
      description: 'Required: name, description, images, sizes. Optional: tagId, isActive',
      examples: {
        success: {
          summary: 'Valid sweet creation request',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          value: examples.create.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Sweet successfully created',
      type: SuccessSweetResponseDto,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      example: examples.create.response.success,
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
      description: 'Failed to create sweet due to server error',
      type: ErrorResponseDto,
    }),
  );
}
