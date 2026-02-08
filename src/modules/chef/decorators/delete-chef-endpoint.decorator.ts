import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

export function DeleteChefDecorator() {
  return applyDecorators(
    ApiParam({
      name: 'id',
      description: 'Chef unique identifier (UUID)',
      example: 'bb0e8400-e29b-41d4-a716-446655440007',
    }),
    ApiOperation({
      summary: 'Delete a chef',
      description: 'Deletes a chef by their unique identifier.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Chef successfully deleted',
      schema: {
        example: {
          data: { message: 'Chef deleted successfully' },
          message: 'Chef deleted successfully',
          statusCode: 200,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Chef not found',
      schema: {
        example: {
          message: 'Chef not found',
          error: 'Not Found',
          statusCode: 404,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete chef due to server error',
      schema: {
        example: {
          message: 'Failed to delete chef',
          error: 'Internal Server Error',
          statusCode: 500,
        },
      },
    }),
  );
}
