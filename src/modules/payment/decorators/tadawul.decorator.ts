import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam, ApiHeader } from '@nestjs/swagger';
import {
  ConfirmPaymentWebhookDto,
  GetTransactionReceiptResponse,
  InitiatePaymentResponse,
  TadawulInitiatePaymentDto,
} from '../dto/tadawul.dto';

export function InitiatePaymentDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Initiate payment',
      description: 'Initiate a new payment for the specified order',
    }),
    ApiParam({
      name: 'orderId',
      type: 'string',
      description: 'The UUID of the order',
    }),
    ApiBody({
      type: TadawulInitiatePaymentDto,
    }),
    ApiHeader({
      name: 'Authorization',
      required: true,
      example: 'Bearer token',
    }),
    ApiResponse({
      status: HttpStatus.CREATED,
      description: 'Payment initiated successfully',
      type: InitiatePaymentResponse,
    }),
  );
}

export function GetTransactionReceiptDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Get transaction receipt',
      description: 'Retrieve the receipt for a specific transaction',
    }),
    ApiParam({
      name: 'orderId',
      type: 'string',
      description: 'The UUID of the order',
    }),
    ApiHeader({
      name: 'Authorization',
      required: true,
      example: 'Bearer token',
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Transaction receipt retrieved successfully',
      type: GetTransactionReceiptResponse,
    }),
  );
}

export function ConfirmPaymentDecorator() {
  return applyDecorators(
    ApiOperation({
      summary: 'Confirm payment webhook',
      description:
        'Confirm a payment for the specified order by processing the webhook from Tadawul',
    }),
    ApiBody({
      type: ConfirmPaymentWebhookDto,
    }),
    ApiResponse({
      status: HttpStatus.OK,
      description: 'Payment confirmed successfully',
    }),
  );
}
