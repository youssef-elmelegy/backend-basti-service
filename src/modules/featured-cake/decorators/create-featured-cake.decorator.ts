import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateFeaturedCakeDto, SuccessFeaturedCakeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FeaturedCakeExamples } from '@/constants/examples';

export function CreateFeaturedCakeDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new featured cake',
      description:
        'Creates a new featured cake product with images, flavor list, piping palette list, and pricing information.',
    }),
    ApiBody({
      type: CreateFeaturedCakeDto,
      description:
        'Required: name, description, images, capacity, flavorList, pipingPaletteList. Optional: tagId, isActive',
      examples: {
        success: {
          summary: 'Valid featured cake creation request',
          value: FeaturedCakeExamples.create.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Featured cake successfully created',
      type: SuccessFeaturedCakeResponseDto,
      example: FeaturedCakeExamples.create.response.success,
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
      description: 'Failed to create featured cake due to server error',
      type: ErrorResponseDto,
    }),
  );
}
