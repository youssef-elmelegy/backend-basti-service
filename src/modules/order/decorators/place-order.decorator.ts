import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CreateOrderDto, OrderResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function PlaceOrderDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Place an order',
      description: 'Place a new order with items, delivery details, and payment information.',
    }),
    ApiBody({
      type: CreateOrderDto,
      description:
        'Order payload containing locationId, paymentMethodId (optional), items array and optional notes.',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Order placed successfully',
      type: OrderResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to place order due to server error',
      type: ErrorResponseDto,
    }),
  );
}
