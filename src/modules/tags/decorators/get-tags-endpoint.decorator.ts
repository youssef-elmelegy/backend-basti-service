import { applyDecorators, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SuccessTagsResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetTagsDecorator() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOperation({
      summary: 'Get all unique tags',
      description:
        'Retrieves all unique tags from cakes and addons. Tags are collected from both tables and returned as a deduplicated list.',
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
