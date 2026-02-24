import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CheckEntityRegionAvailabilityDto, CheckEntityAvailabilityResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { PredesignedCakesExamples } from '@/constants/examples/predesigned-cakes.examples';

export function CheckEntityRegionAvailabilityDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Check if a flavor, shape, or decoration is available in a specific region',
      description:
        'Verify whether a flavor, shape, or decoration is available (has pricing) in a specific region. This is a public endpoint that helps users understand what customization options are available in their region.',
    }),
    ApiBody({
      type: CheckEntityRegionAvailabilityDto,
      description: 'Region and entity IDs to check availability',
      examples: {
        success: {
          summary: 'Valid availability check request',
          value: PredesignedCakesExamples.checkAvailability.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Entity availability checked successfully',
      type: CheckEntityAvailabilityResponseDto,
      example: PredesignedCakesExamples.checkAvailability.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid region ID',
      type: ErrorResponseDto,
    }),
  );
}
