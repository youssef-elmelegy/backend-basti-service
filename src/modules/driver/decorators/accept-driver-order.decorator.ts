import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function AcceptDriverOrderDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Accept assigned order',
      description:
        'Driver accepts an assigned order within 30 minutes from driverAssignedAt. Sets driverData and marks order out_for_delivery.',
    }),
    ApiParam({ name: 'orderId', type: String, description: 'Order ID (UUID)' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Order accepted successfully' }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Assignment expired or invalid state',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Order or driver not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized',
      type: ErrorResponseDto,
    }),
    ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ErrorResponseDto }),
  );
}
