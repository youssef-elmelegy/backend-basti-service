import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function AcceptDriverOrderDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Accept assigned order',
      description:
        'Driver accepts an assigned order. Records driverData. If the order is already ready it goes out_for_delivery immediately; otherwise the status is unchanged and it flips to out_for_delivery once the bakery marks it ready.',
    }),
    ApiParam({ name: 'orderId', type: String, description: 'Order ID (UUID)' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Order accepted successfully' }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Order not assigned to driver or invalid state',
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
