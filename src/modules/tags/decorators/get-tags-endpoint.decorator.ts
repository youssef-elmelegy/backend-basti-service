import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessTagsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetTagsDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get all tags',
      description: 'Retrieves all tags from the tags table, ordered by display_order.',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Tags successfully retrieved',
      type: SuccessTagsResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve tags due to server error',
      type: ErrorResponseDto,
    }),
  );
}
