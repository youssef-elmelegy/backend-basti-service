import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateAddonDto, SuccessAddonResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { AddExamples } from '@/constants/examples';

export function CreateAddonDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new add-on',
      description:
        'Creates a new add-on product with images, category, price, and tags information.',
    }),
    ApiBody({
      type: CreateAddonDto,
      description: 'Required: name, description, images, category, price, tags. Optional: isActive',
      examples: {
        success: {
          summary: 'Valid add-on creation request',
          value: AddExamples.create.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Add-on successfully created',
      type: SuccessAddonResponseDto,
      example: AddExamples.create.response.success,
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
      description: 'Failed to create add-on due to server error',
      type: ErrorResponseDto,
    }),
  );
}
