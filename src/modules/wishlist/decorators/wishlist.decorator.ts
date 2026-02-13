import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WishlistResponseDto } from '../dto';

export function CreateWishlistItemDecorator() {
  return applyDecorators(
    ApiOperation({ summary: 'Add item to wishlist' }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Item added to wishlist successfully',
      type: WishlistResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid Cake/Addon ID or User ID',
    }),
    ApiResponse({ status: HttpStatus.CONFLICT, description: 'Item already exists in wishlist' }),
  );
}

// export function GetAllWishlistItemsDecorator() {
//   return applyDecorators(
//     ApiOperation({ summary: 'Get all wishlist items' }),
//     ApiQuery({ name: 'userId', required: false, description: 'Filter by specific user' }),
//     ApiResponse({
//       status: HttpStatus.OK,
//       description: 'Wishlist items retrieved successfully',
//       type: [WishlistItemResponse],
//     }),
//   );
// }

// export function GetWishlistItemDecorator() {
//   return applyDecorators(
//     ApiOperation({ summary: 'Get a wishlist item by ID' }),
//     ApiResponse({
//       status: HttpStatus.OK,
//       description: 'Wishlist item retrieved successfully',
//       type: WishlistItemResponse,
//     }),
//     ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Wishlist item not found' }),
//   );
// }

export function DeleteWishlistItemDecorator() {
  return applyDecorators(
    ApiOperation({ summary: 'Remove item from wishlist' }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Item removed from wishlist successfully',
    }),
    ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Wishlist item not found' }),
  );
}
