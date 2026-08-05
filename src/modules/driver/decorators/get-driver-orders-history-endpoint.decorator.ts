import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { OrderStatus } from '@/modules/order/dto/get.dto';

export function GetDriverOrdersHistoryDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: "Get a driver's order history",
      description:
        "Admin view of a driver's orders across all statuses (paginated). Optional status, search (q) and sort filters. Returns { items, pagination }.",
    }),
    ApiParam({ name: 'id', type: String, description: 'Driver ID (UUID)' }),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiQuery({
      name: 'q',
      required: false,
      type: String,
      description: 'Search by reference number',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      isArray: true,
      enum: OrderStatus,
      description: 'Filter by statuses (comma-separated or repeated). Defaults to all statuses.',
    }),
    ApiQuery({ name: 'sort', required: false, enum: ['asc', 'desc'], description: 'Sort by date' }),
    ApiResponse({ status: HttpStatus.OK, description: 'Driver orders retrieved successfully' }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Driver not found',
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
