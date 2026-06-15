import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetDriverOrdersDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get driver orders',
      description:
        'Get orders assigned to the authenticated driver. Optional isAssigned filters by driverData presence.',
    }),
    ApiQuery({
      name: 'isAssigned',
      required: false,
      type: Boolean,
      description: 'Filter by accepted assignment state',
    }),
    ApiResponse({ status: HttpStatus.OK, description: 'Driver orders retrieved successfully' }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
      type: ErrorResponseDto,
    }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ErrorResponseDto }),
  );
}
