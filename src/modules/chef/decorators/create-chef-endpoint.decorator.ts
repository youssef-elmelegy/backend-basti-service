import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateChefDto, SuccessChefResponseDto } from '../dto';
import { ChefExamples } from '@/constants/examples';

export function CreateChefDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new chef',
      description: 'Creates a new chef and assigns them to a bakery.',
    }),
    ApiBody({
      type: CreateChefDto,
      description: 'Chef creation data',
      examples: {
        success: {
          summary: 'Valid chef creation request',
          value: ChefExamples.create.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Chef successfully created',
      type: SuccessChefResponseDto,
      example: ChefExamples.create.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed or bakery not found)',
      schema: {
        example: {
          message: 'Invalid input data',
          error: 'Bad Request',
          statusCode: 400,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to create chef due to server error',
      schema: {
        example: {
          message: 'Failed to create chef',
          error: 'Internal Server Error',
          statusCode: 500,
        },
      },
    }),
  );
}
