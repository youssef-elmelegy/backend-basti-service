import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessAddonsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { AddExamples } from '@/constants/examples';

export function GetAllAddonsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all add-ons',
      description: 'Retrieve all add-ons with pagination support',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Add-ons retrieved successfully',
      type: SuccessAddonsResponseDto,
      example: AddExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve add-ons',
      type: ErrorResponseDto,
    }),
  );
}
