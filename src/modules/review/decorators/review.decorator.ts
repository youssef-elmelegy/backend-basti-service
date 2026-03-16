import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreateReviewDto,
  ReviewResponseDto,
  ReviewDeleteResponseDto,
  UpdateReviewDto,
  PaginatedBakeyReviewsResponseDto,
} from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function CreateReviewDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create a new review',
      description: 'Submit a review for an order. Users can only review their own orders.',
    }),
    ApiBody({
      type: CreateReviewDto,
      description: 'Review data including orderId, bakeryId, rating (1-5), and optional reviewText',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Review created successfully',
      type: ReviewResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data, order not found, or already reviewed',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to create review',
      type: ErrorResponseDto,
    }),
  );
}

export function GetReviewsByBakeryDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all reviews for a bakery',
      description: 'Get all reviews for a bakery with user info',
    }),
    ApiParam({
      name: 'bakeryId',
      type: 'string',
      description: 'The UUID of the bakery',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Reviews retrieved successfully with user information',
      type: PaginatedBakeyReviewsResponseDto,
      example: {
        code: 200,
        success: true,
        message: 'Reviews fetched successfully',
        data: {
          reviews: [
            {
              id: '69731d5e-27ca-48a8-acde-d2292750dee9',
              userId: '550e8400-e29b-41d4-a716-446655440000',
              orderId: '0c8fcbcb-7edf-46fa-9645-9d42edd68b78',
              bakeryId: '550e8400-e29b-41d4-a716-446655440200',
              rating: 4,
              reviewText: "Amazing, but the packaging wasn't good",
              firstName: 'John',
              lastName: 'Doe',
              profileImage: 'https://example.com/john.jpg',
              createdAt: '2026-03-16T01:11:48.645Z',
              updatedAt: '2026-03-16T01:11:48.645Z',
            },
          ],
          averageRating: 4,
          totalReviews: 3,
          pagination: {
            total: 3,
            totalPages: 1,
            page: 1,
            limit: 10,
          },
        },
        timestamp: '2026-03-16T06:56:57.513Z',
      },
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Bakery not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve reviews',
      type: ErrorResponseDto,
    }),
  );
}

export function GetMyReviewsDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get my reviews',
      description: 'Retrieve all reviews submitted by the authenticated user',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Reviews retrieved successfully',
      type: [ReviewResponseDto],
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve reviews',
      type: ErrorResponseDto,
    }),
  );
}

export function GetReviewByIdDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get review by ID',
      description: 'Retrieve a specific review by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the review',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Review retrieved successfully',
      type: ReviewResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Review not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve review',
      type: ErrorResponseDto,
    }),
  );
}

export function UpdateReviewDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update a review',
      description: 'Update an existing review. Users can only update their own reviews.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the review to update',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdateReviewDto,
      description: 'Fields to update: rating and/or reviewText',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Review updated successfully',
      type: ReviewResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Review not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - not authorized to update this review',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update review',
      type: ErrorResponseDto,
    }),
  );
}

export function DeleteReviewDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete a review',
      description: 'Delete an existing review. Users can only delete their own reviews.',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the review to delete',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Review deleted successfully',
      type: ReviewDeleteResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Review not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - not authorized to delete this review',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete review',
      type: ErrorResponseDto,
    }),
  );
}

export function AdminDeleteReviewDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete a review (Admin)',
      description: 'Admin endpoint to delete any review',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the review to delete',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Review deleted successfully',
      type: ReviewDeleteResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Review not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.FORBIDDEN,
      description: 'Forbidden - insufficient permissions',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete review',
      type: ErrorResponseDto,
    }),
  );
}
