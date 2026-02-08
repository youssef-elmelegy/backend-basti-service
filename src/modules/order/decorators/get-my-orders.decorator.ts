import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrderResponseDto } from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function GetMyOrdersDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: "Get current user's orders",
      description: 'Retrieve all orders for the authenticated user (most recent first).',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Orders retrieved successfully',
      type: OrderResponseDto,
      isArray: true,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve orders due to server error',
      type: ErrorResponseDto,
    }),
  );
}
