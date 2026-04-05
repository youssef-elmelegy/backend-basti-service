import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ChangeTagOrderDto, SuccessTagResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function ChangeTagOrderDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Change tag display order',
      description:
        'Updates the display order of a tag. When moving a tag, other tags in the range are automatically shifted.',
    }),
    ApiBody({
      type: ChangeTagOrderDto,
      description: 'New display order for the tag',
      examples: {
        success: {
          summary: 'Valid tag order change request',
          value: { order: 2 },
        },
      },
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Tag order successfully updated - returns all tags with updated display order',
      type: SuccessTagResponseDto,
      isArray: true,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid tag ID or order values',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - Admin role required',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to change tag order',
      type: ErrorResponseDto,
    }),
  );
}
