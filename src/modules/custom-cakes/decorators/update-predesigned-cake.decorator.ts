import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { UpdatePredesignedCakeDto, PredesignedCakeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { PredesignedCakesExamples } from '@/constants/examples/predesigned-cakes.examples';

export function UpdatePredesignedCakeDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update a predesigned cake',
      description:
        'Update one or more fields of an existing predesigned cake (name, description, or tag)',
    }),
    ApiBody({
      type: UpdatePredesignedCakeDto,
      description: 'Predesigned cake update data (all fields optional)',
      examples: {
        success: {
          summary: 'Valid update request',
          value: PredesignedCakesExamples.update.request,
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Predesigned cake updated successfully',
      type: PredesignedCakeResponseDto,
      example: PredesignedCakesExamples.update.response.success,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Predesigned cake not found',
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
