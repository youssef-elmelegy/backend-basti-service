import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { VerifyDeliveryCodeDto } from '../dto';

export function VerifyDeliveryCodeDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Verify delivery code',
      description: 'Verify the driver-provided delivery code and mark the order as delivered.',
    }),
    ApiParam({ name: 'id', type: String, description: 'Order ID (UUID)' }),
    ApiBody({ type: VerifyDeliveryCodeDto, description: 'Delivery code submitted by the user' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Order marked as delivered successfully' }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid code',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Order not found',
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
