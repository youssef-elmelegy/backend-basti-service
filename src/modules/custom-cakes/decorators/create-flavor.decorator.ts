import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateFlavorDto, SuccessFlavorResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FlavorExamples } from '@/constants/examples';

export function CreateFlavorDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new flavor',
      description: 'Creates a new flavor with image URL and optional tag.',
    }),
    ApiBody({
      type: CreateFlavorDto,
      description: 'Required: title, description, flavorUrl',
      examples: {
        success: {
          summary: 'Valid flavor creation request',
          value: FlavorExamples.create.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Flavor successfully created',
      type: SuccessFlavorResponseDto,
      example: FlavorExamples.create.response.success,
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
      description: 'Failed to create flavor due to server error',
      type: ErrorResponseDto,
    }),
  );
}
