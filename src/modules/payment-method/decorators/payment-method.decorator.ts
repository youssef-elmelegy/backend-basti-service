import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  SuccessPaymentMethodResponseDto,
  SuccessPaymentMethodsResponseDto,
  SuccessDeletePaymentMethodResponseDto,
} from '../dto';
import { ErrorResponseDto } from '@/modules/auth/dto';

export function CreatePaymentMethodDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Create a new payment method',
      description: "Add a new payment method to the authenticated user's account",
    }),
    ApiBody({
      type: CreatePaymentMethodDto,
      description:
        'Required: type. Optional: cardHolderName, cardLastFourDigits, cardExpiryMonth, cardExpiryYear, isDefault',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Payment method created successfully',
      type: SuccessPaymentMethodResponseDto,
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
      description: 'Failed to create payment method',
      type: ErrorResponseDto,
    }),
  );
}

export function GetAllPaymentMethodsDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get all payment methods',
      description: 'Retrieve all saved payment methods for the authenticated user',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Payment methods retrieved successfully',
      type: SuccessPaymentMethodsResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve payment methods',
      type: ErrorResponseDto,
    }),
  );
}

export function GetPaymentMethodByIdDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Get payment method by ID',
      description: 'Retrieve a specific payment method by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the payment method',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Payment method retrieved successfully',
      type: SuccessPaymentMethodResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Payment method not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to retrieve payment method',
      type: ErrorResponseDto,
    }),
  );
}

export function UpdatePaymentMethodDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Update a payment method',
      description: 'Update an existing payment method by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the payment method to update',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiBody({
      type: UpdatePaymentMethodDto,
      description:
        'All fields are optional: type, cardHolderName, cardLastFourDigits, cardExpiryMonth, cardExpiryYear, isDefault',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Payment method updated successfully',
      type: SuccessPaymentMethodResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.BAD_REQUEST,
      description: 'Invalid input data (validation failed)',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Payment method not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to update payment method',
      type: ErrorResponseDto,
    }),
  );
}

export function DeletePaymentMethodDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Delete a payment method',
      description: 'Remove a payment method by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'The UUID of the payment method to delete',
      example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Payment method deleted successfully',
      type: SuccessDeletePaymentMethodResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.NOT_FOUND,
      description: 'Payment method not found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.UNAUTHORIZED,
      description: 'Unauthorized - missing or invalid token',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      description: 'Failed to delete payment method',
      type: ErrorResponseDto,
    }),
  );
}
