import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetAllDecorationsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { DecorationExamples } from '@/constants/examples';

export function GetAllDecorationsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all decorations',
      description:
        'Retrieves all available decorations with optional filtering by tag, active status, region (with regional pricing), and search. When isActive is specified, only active or inactive decorations are returned. When regionId is provided, regional pricing is included.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Decorations successfully retrieved',
      type: GetAllDecorationsResponseDto,
      example: DecorationExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid query parameters',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve decorations due to server error',
      type: ErrorResponseDto,
    }),
  );
}
