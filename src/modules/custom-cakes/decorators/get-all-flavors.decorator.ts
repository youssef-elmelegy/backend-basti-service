import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetAllFlavorsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FlavorExamples } from '@/constants/examples';

export function GetAllFlavorsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all flavors',
      description:
        'Retrieves all available flavors with optional filtering by shape (with variant images), region (with regional pricing), and search. When shapeId is provided, only flavors with variant images for that shape are returned. When regionId is provided, regional pricing is included in the response.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Flavors successfully retrieved',
      type: GetAllFlavorsResponseDto,
      example: FlavorExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid query parameters',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve flavors due to server error',
      type: ErrorResponseDto,
    }),
  );
}
