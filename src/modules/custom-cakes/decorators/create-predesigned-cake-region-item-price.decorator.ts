import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CreatePredesignedCakeRegionItemPriceDto, RegionItemPriceResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { PredesignedCakesExamples } from '@/constants/examples/predesigned-cakes.examples';

export function CreatePredesignedCakeRegionItemPriceDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create or update regional pricing for a predesigned cake',
      description:
        'Create new regional pricing for a predesigned cake or update existing pricing. Uses upsert pattern: returns 201 CREATED if new, 200 OK if updated.',
    }),
    ApiBody({
      type: CreatePredesignedCakeRegionItemPriceDto,
      description: 'Regional pricing data',
      examples: {
        create: {
          summary: 'Valid create pricing request',
          value: PredesignedCakesExamples.createRegionItemPrice.request.create,
        },
        update: {
          summary: 'Valid update pricing request (same schema)',
          value: PredesignedCakesExamples.createRegionItemPrice.request.update,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Regional pricing created successfully',
      type: RegionItemPriceResponseDto,
      example: PredesignedCakesExamples.createRegionItemPrice.response.success,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Regional pricing updated successfully',
      type: RegionItemPriceResponseDto,
      example: PredesignedCakesExamples.createRegionItemPrice.response.updated,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid region or predesigned cake ID',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized access',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Insufficient permissions',
      type: ErrorResponseDto,
    }),
  );
}
