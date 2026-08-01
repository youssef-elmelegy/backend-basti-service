import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ClientNotRespondingDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Cancel order due to client not responding',
      description: 'Driver cancels an assigned order due to client not responding.',
    }),
    ApiParam({ name: 'orderId', type: String, description: 'Order ID (UUID)' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Order cancelled successfully' }),
  );
}
