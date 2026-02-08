import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessBakeriesResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { BakeryExamples } from '@/constants/examples';

export function GetAllBakeriesDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all bakeries',
      description: 'Retrieves a list of all bakeries with their regions and types.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Bakeries successfully retrieved',
      type: SuccessBakeriesResponseDto,
      example: BakeryExamples.getAll.response.success,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve bakeries due to server error',
      type: ErrorResponseDto,
    }),
  );
}
