import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { GetBiggestCapacityBakeryDto, SuccessBakeryResponseDto } from '../dto';
import { BakeryExamples } from '@/constants/examples';

export function GetBiggestCapacityBakeryDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get biggest capacity bakery',
      description: 'Retrieves the bakery with the biggest capacity for a given region and type.',
    }),
    ApiBody({
      type: GetBiggestCapacityBakeryDto,
    }),
    ApiParam({
      name: 'regionId',
      description: 'Region ID this bakery operates in',
      type: 'string',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Bakery successfully retrieved',
      type: SuccessBakeryResponseDto,
      example: BakeryExamples.getById.response.success,
    }),
  );
}
