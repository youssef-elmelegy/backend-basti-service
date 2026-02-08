import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuccessTagDeleteResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { TagExamples } from '@/constants/examples/tag-examples';

export function DeleteTagDecorator() {
  return applyDecorators(
    ApiParam({
      name: 'id',
      description: 'Tag unique identifier (UUID)',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiOperation({
      summary: 'Delete a tag',
      description: 'Deletes a tag by its unique identifier.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Tag successfully deleted',
      type: SuccessTagDeleteResponseDto,
      schema: {
        example: TagExamples.delete.response.success,
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Tag not found',
      type: ErrorResponseDto,
      schema: {
        example: TagExamples.delete.response.notFound,
      },
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete tag due to server error',
      type: ErrorResponseDto,
      schema: {
        example: {
          message: 'Failed to delete tag',
          error: 'Internal Server Error',
          statusCode: 500,
        },
      },
    }),
  );
}
