import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UpdateBakeryDto, SuccessBakeryResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { BakeryExamples } from '@/constants/examples';

export function UpdateBakeryDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update a bakery',
      description:
        'Update bakery details including name, location, capacity, and types. All fields are optional.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the bakery to update',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdateBakeryDto,
      description:
        'Partial update - all fields are optional. Provide only the fields you want to update.',
      examples: {
        success: {
          summary: 'Valid bakery update request',
          value: BakeryExamples.update?.request as Record<string, unknown>,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Bakery updated successfully',
      type: SuccessBakeryResponseDto,
      example: BakeryExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Bakery not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Validation error',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update bakery',
      type: ErrorResponseDto,
    }),
  );
}
