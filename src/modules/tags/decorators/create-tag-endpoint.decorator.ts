import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateTagDto, SuccessTagResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { TagExamples } from '@/constants/examples/tag-examples';

export function CreateTagDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new tag',
      description: 'Creates a new tag with unique name and display order.',
    }),
    ApiBody({
      type: CreateTagDto,
      description: 'Tag creation data',
      examples: {
        success: {
          summary: 'Valid tag creation request',
          value: TagExamples.create.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Tag successfully created',
      type: SuccessTagResponseDto,
      example: TagExamples.create.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Tag name or display order already exists',
      type: ErrorResponseDto,
      schema: {
        oneOf: [
          { example: TagExamples.create.response.conflict },
          { example: TagExamples.create.response.displayOrderConflict },
        ],
      },
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to create tag due to server error',
      type: ErrorResponseDto,
      schema: {
        example: {
          message: 'Failed to create tag',
          error: 'Internal Server Error',
          statusCode: 500,
        },
      },
    }),
  );
}
