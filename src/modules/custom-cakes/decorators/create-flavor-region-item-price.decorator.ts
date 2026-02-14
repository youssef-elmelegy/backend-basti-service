import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateFlavorRegionItemPriceDto, SuccessFlavorRegionItemPriceResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { FlavorExamples } from '@/constants/examples';

export function CreateFlavorRegionItemPriceDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create regional pricing for flavor',
      description: 'Sets the price of a flavor in a specific region.',
    }),
    ApiBody({
      type: CreateFlavorRegionItemPriceDto,
      description: 'Region ID and price for the flavor',
      examples: {
        success: {
          summary: 'Valid regional pricing request',
          value: FlavorExamples.createRegionItemPrice.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Regional pricing successfully created',
      type: SuccessFlavorRegionItemPriceResponseDto,
      example: FlavorExamples.createRegionItemPrice.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Flavor or region not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.CONFLICT,
      description: 'Regional pricing already exists for this flavor and region',
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
      description: 'Failed to create flavor region price due to server error',
      type: ErrorResponseDto,
    }),
  );
}
