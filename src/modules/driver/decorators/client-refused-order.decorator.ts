import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ClientRefusedOrderDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Cancel order due to client refusing',
      description: 'Driver cancels an assigned order due to client refusing.',
    }),
    ApiParam({ name: 'orderId', type: String, description: 'Order ID (UUID)' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Order cancelled successfully' }),
  );
}
