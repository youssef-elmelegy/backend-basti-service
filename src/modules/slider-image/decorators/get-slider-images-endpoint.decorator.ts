import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessSliderImagesResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetSliderImagesDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get all slider images',
      description: 'Retrieves all slider images displayed in the application slider/carousel.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Slider images successfully retrieved',
      type: SuccessSliderImagesResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve slider images due to server error',
      type: ErrorResponseDto,
    }),
  );
}
