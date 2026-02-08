import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateBakeryDto, SuccessBakeryResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { BakeryExamples } from '@/constants/examples';

export function CreateBakeryDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Create a new bakery',
      description:
        'Creates a new bakery with name, location, region, capacity, and supported cake types.',
    }),
    ApiBody({
      type: CreateBakeryDto,
      description:
        'Required: name, locationDescription (min 5 chars), regionId (valid UUID), capacity (number), bakeryTypes (array of strings)',
      examples: {
        success: {
          summary: 'Valid bakery creation request',
          value: BakeryExamples.create.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Bakery successfully created',
      type: SuccessBakeryResponseDto,
      example: BakeryExamples.create.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed or invalid region ID)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to create bakery due to server error',
      type: ErrorResponseDto,
    }),
  );
}
