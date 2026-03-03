import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetAllShapesResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { ShapeExamples } from '@/constants/examples';

export function GetAllShapesDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all shapes',
      description:
        'Retrieves all available cake shapes with optional filtering by region (with regional pricing), active status, and search. When regionId is provided, regional pricing is included. When isActive is specified, only active or inactive shapes are returned.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Shapes successfully retrieved',
      type: GetAllShapesResponseDto,
      example: ShapeExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid query parameters',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve shapes due to server error',
      type: ErrorResponseDto,
    }),
  );
}
