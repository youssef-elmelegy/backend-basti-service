import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateShapeRegionItemPriceDto, SuccessShapeRegionItemPriceResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { ShapeExamples } from '@/constants/examples';

export function CreateShapeRegionItemPriceDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create regional pricing for shape',
      description: 'Sets the price of a shape in a specific region.',
    }),
    ApiBody({
      type: CreateShapeRegionItemPriceDto,
      description: 'Region ID and price for the shape',
      examples: {
        success: {
          summary: 'Valid regional pricing request',
          value: ShapeExamples.createRegionItemPrice.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Regional pricing successfully created',
      type: SuccessShapeRegionItemPriceResponseDto,
      example: ShapeExamples.createRegionItemPrice.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Shape or region not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Regional pricing already exists for this shape and region',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to create shape region price due to server error',
      type: ErrorResponseDto,
    }),
  );
}
