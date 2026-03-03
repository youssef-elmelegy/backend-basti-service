import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import {
  CreateAddonItemDto,
  CreateSweetItemDto,
  CreateFeaturedCakeItemDto,
  CreatePredesignedCakeItemDto,
  CreateCustomCakeItemDto,
  UpdateQuantityDto,
  ToggleStatusDto,
  DeleteOneDto,
  BulkDeleteDto,
  SuccessCartResponseDto,
} from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';
import { CartExamples } from '@/constants/examples';

export function GetAllCartItemsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all cart items',
      description: 'Retrieve all cart items for the authenticated user, grouped by category',
    }),
    ApiQuery({
      name: 'regionId',
      type: 'string',
      required: true,
      description: 'The UUID of the region to get prices for',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cart items retrieved successfully',
      type: SuccessCartResponseDto,
      example: CartExamples.getAllCartItems.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid regionId (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve cart items',
      type: ErrorResponseDto,
    }),
  );
}

export function AddAddonToCartDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add an addon to cart',
      description: "Add an addon item to the authenticated user's cart",
    }),
    ApiBody({
      type: CreateAddonItemDto,
      description: 'Required: addonId. Optional: quantity, isIncluded',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Addon added to cart successfully',
      type: SuccessCartResponseDto,
      example: CartExamples.addAddon.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Addon not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to add addon to cart',
      type: ErrorResponseDto,
    }),
  );
}

export function AddSweetToCartDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a sweet to cart',
      description: "Add a sweet item to the authenticated user's cart",
    }),
    ApiBody({
      type: CreateSweetItemDto,
      description: 'Required: sweetId. Optional: quantity, isIncluded',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Sweet added to cart successfully',
      type: SuccessCartResponseDto,
      example: CartExamples.addSweet.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Sweet not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to add sweet to cart',
      type: ErrorResponseDto,
    }),
  );
}

export function AddFeaturedCakeToCartDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a featured cake to cart',
      description: "Add a featured cake to the authenticated user's cart with a type category",
    }),
    ApiBody({
      type: CreateFeaturedCakeItemDto,
      description: 'Required: featuredCakeId. Optional: quantity, isIncluded',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Featured cake added to cart successfully',
      type: SuccessCartResponseDto,
      example: CartExamples.addFeaturedCake.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Featured cake not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to add featured cake to cart',
      type: ErrorResponseDto,
    }),
  );
}

export function AddPredesignedCakeToCartDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a predesigned cake to cart',
      description: "Add a predesigned cake to the authenticated user's cart with a type category",
    }),
    ApiBody({
      type: CreatePredesignedCakeItemDto,
      description: 'Required: predesignedCakeId. Optional: quantity, isIncluded',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Predesigned cake added to cart successfully',
      type: SuccessCartResponseDto,
      example: CartExamples.addPredesignedCake.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Predesigned cake not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to add predesigned cake to cart',
      type: ErrorResponseDto,
    }),
  );
}

export function AddCustomCakeToCartDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Add a custom cake to cart',
      description:
        "Add a custom cake with specified configurations (shape, flavor, decoration, frost color) to the authenticated user's cart",
    }),
    ApiBody({
      type: CreateCustomCakeItemDto,
      description: 'Required: customCakeConfigs. Optional: quantity, isIncluded',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Custom cake added to cart successfully',
      type: SuccessCartResponseDto,
      example: CartExamples.addCustomCake.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'One or more cake components (shape, flavor, decoration) not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to add custom cake to cart',
      type: ErrorResponseDto,
    }),
  );
}

export function DeleteCartItemDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete a cart item',
      description: "Remove an item from the authenticated user's cart by its ID",
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the cart item to delete',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: DeleteOneDto,
      description: 'Required: regionId (to return updated cart with correct prices)',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cart item deleted successfully',
      type: SuccessCartResponseDto,
      example: CartExamples.deleteCartItem.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Cart item not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete cart item',
      type: ErrorResponseDto,
    }),
  );
}

export function BulkDeleteCartItemsDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bulk delete cart items',
      description: "Remove multiple items from the authenticated user's cart by their IDs",
    }),
    ApiBody({
      type: BulkDeleteDto,
      description: 'Required: ids (array of cart item UUIDs), regionId',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cart items deleted successfully',
      type: SuccessCartResponseDto,
      example: CartExamples.bulkDeleteCartItems.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'One or more cart items not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete cart items',
      type: ErrorResponseDto,
    }),
  );
}

export function ToggleCartItemDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Toggle cart item inclusion',
      description: 'Toggle whether a cart item is included in the active cart or saved for later',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the cart item to toggle',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: ToggleStatusDto,
      description: 'Required: isIncluded (boolean), regionId',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cart item toggled successfully',
      type: SuccessCartResponseDto,
      example: CartExamples.toggleCartItem.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Cart item not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to toggle cart item',
      type: ErrorResponseDto,
    }),
  );
}

export function UpdateCartItemQuantityDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Update cart item quantity',
      description: 'Update the quantity of a specific cart item',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the cart item to update',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdateQuantityDto,
      description: 'Required: quantity (number), regionId',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Cart item quantity updated successfully',
      type: SuccessCartResponseDto,
      example: CartExamples.updateQuantity.response.success,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Cart item not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update cart item quantity',
      type: ErrorResponseDto,
    }),
  );
}
