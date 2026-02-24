import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import {
  CreateDecorationRegionItemPriceDto,
  SuccessDecorationRegionItemPriceResponseDto,
} from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { DecorationExamples } from '@/constants/examples';

export function CreateDecorationRegionItemPriceDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create regional pricing for decoration',
      description: 'Sets the price of a decoration in a specific region.',
    }),
    ApiBody({
      type: CreateDecorationRegionItemPriceDto,
      description: 'Region ID and price for the decoration',
      examples: {
        success: {
          summary: 'Valid regional pricing request',
          value: DecorationExamples.createRegionItemPrice.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Regional pricing successfully created',
      type: SuccessDecorationRegionItemPriceResponseDto,
      example: DecorationExamples.createRegionItemPrice.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Decoration or region not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Regional pricing already exists for this decoration and region',
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
      description: 'Failed to create decoration region price due to server error',
      type: ErrorResponseDto,
    }),
  );
}
