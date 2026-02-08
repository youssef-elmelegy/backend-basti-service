import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SuccessChefResponseDto } from '../dto';

export function GetOneChefDecorator() {
  return applyDecorators(
    ApiParam({
      name: 'id',
      description: 'Chef unique identifier (UUID)',
      example: 'bb0e8400-e29b-41d4-a716-446655440007',
    }),
    ApiOperation({
      summary: 'Get a chef by ID',
      description: 'Retrieves a single chef by their unique identifier.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Chef successfully retrieved',
      type: SuccessChefResponseDto,
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
      description: 'Failed to retrieve chef due to server error',
      schema: {
        example: {
          message: 'Failed to retrieve chef',
          error: 'Internal Server Error',
          statusCode: 500,
        },
      },
    }),
  );
}
