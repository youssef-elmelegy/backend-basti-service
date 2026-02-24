import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DeletePredesignedCakeResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { PredesignedCakesExamples } from '@/constants/examples/predesigned-cakes.examples';

export function DeletePredesignedCakeDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete a predesigned cake',
      description: 'Permanently delete a predesigned cake and all associated region pricing',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Predesigned cake deleted successfully',
      type: DeletePredesignedCakeResponseDto,
      example: PredesignedCakesExamples.delete.response.success,
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
