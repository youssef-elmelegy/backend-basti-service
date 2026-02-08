import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { UpdateChefDto, SuccessChefResponseDto } from '../dto';
import { ChefExamples } from '@/constants/examples';

export function UpdateChefDecorator() {
  return applyDecorators(
    ApiParam({
      name: 'id',
      description: 'Chef unique identifier (UUID)',
      example: 'bb0e8400-e29b-41d4-a716-446655440007',
    }),
    ApiOperation({
      summary: 'Update a chef',
      description: 'Updates an existing chef with new information.',
    }),
    ApiBody({
      type: UpdateChefDto,
      description: 'Chef update data',
      examples: {
        success: {
          summary: 'Valid chef update request',
          value: ChefExamples.update.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Chef successfully updated',
      type: SuccessChefResponseDto,
      example: ChefExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data',
      schema: {
        example: {
          message: 'Invalid input data',
          error: 'Bad Request',
          statusCode: 400,
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
      description: 'Failed to update chef due to server error',
      schema: {
        example: {
          message: 'Failed to update chef',
          error: 'Internal Server Error',
          statusCode: 500,
        },
      },
    }),
  );
}
