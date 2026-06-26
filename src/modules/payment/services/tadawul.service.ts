import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { env } from '@/env';
import { orders } from '@/db/schema';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import {
  TadawulError,
  TadawulGetTransactionReceiptResponse,
  TadawulInitiatePaymentResponse,
  InitiatePaymentResponse,
  GetTransactionReceiptResponse,
  ConfirmPaymentWebhookDto,
} from '../dto/tadawul.dto';
import { SuccessResponse, successResponse } from '@/utils';

@Injectable()
export class TadawulService {
  private readonly logger = new Logger(TadawulService.name);

  async initiatePayment(
    orderId: string,
    userId: string,
    successUrl?: string,
    failureUrl?: string,
  ): Promise<SuccessResponse<InitiatePaymentResponse>> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

      if (!order) {
        throw new NotFoundException('routes.orders.not_found');
      }

      if (order.userId !== userId) {
        throw new NotFoundException('routes.payment.invalid_order_user');
      }

      const res = await fetch(`${env.TADAWUL_URL}/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: env.TADAWUL_ID,
          amount: order.finalPrice,
          phone: order.userData.phoneNumber,
          email: order.userData.email,
          custom_ref: order.id,
          backend_url: env.TADAWUL_WEBHOOK_URL,
          frontend_url: successUrl || '',
          failed_front_end_url: failureUrl || '',
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as TadawulError;
        throw new BadRequestException(
          'routes.payment.failed_initiate_payment',
          err.message
            ? err.errors
              ? JSON.stringify(err.errors)
              : 'Unknown error'
            : 'Unknown error',
        );
      }

      const data = (await res.json()) as TadawulInitiatePaymentResponse;

      return successResponse(
        {
          url: data.url,
          orderId: data.custom_ref,
        },
        'routes.payment.payment_initiated',
      );
    } catch (error) {
      throw new InternalServerErrorException(
        'routes.payment.failed_initiate_payment',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async confirmPayment(body: ConfirmPaymentWebhookDto) {
    const { result, amount, store_id, our_ref, payment_method, custom_ref } = body;

    try {
      if (result.toLowerCase() !== 'success') {
        const err = `Payment status is not success, result: ${result}`;
        this.logger.error(err);
        throw new BadRequestException(err);
      }

      const [order] = await db.select().from(orders).where(eq(orders.id, custom_ref)).limit(1);

      if (!order) {
        const err = `Order not found for custom_ref: ${custom_ref}`;
        this.logger.error(err);
        throw new NotFoundException(err);
      }

      if (store_id !== env.TADAWUL_ID) {
        const err = `Store ID mismatch`;
        this.logger.error(err);
        throw new BadRequestException(err);
      }

      if (amount !== order.finalPrice) {
        const err = `Amount mismatch, expected: ${order.finalPrice}, received: ${amount}`;
        this.logger.error(err);
        throw new BadRequestException(err);
      }

      await db
        .update(orders)
        .set({
          orderStatus: 'confirmed',
          paymentData: {
            type: '',
            cardHolderName: '',
            cardLastFourDigits: '',
            cardExpiryMonth: 0,
            cardExpiryYear: 0,
            paymentGatewayName: 'tadawul',
            paymentGatewaySubName: payment_method,
            paymentGatewayRef: our_ref,
          },
        })
        .where(eq(orders.id, custom_ref))
        .returning();

      this.logger.log(`Order ${custom_ref} confirmed successfully`);
      return successResponse({});
    } catch (error) {
      const err = `Failed to confirm payment, error: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(err);
      throw new InternalServerErrorException(err);
    }
  }

  async getTransactionReceipt(
    orderId: string,
  ): Promise<SuccessResponse<GetTransactionReceiptResponse>> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

      if (!order) {
        throw new NotFoundException('routes.orders.not_found');
      }

      const res = await fetch(`${env.TADAWUL_URL}/receipt/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          store_id: env.TADAWUL_ID,
          custom_ref: order.id,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as TadawulError;
        throw new BadRequestException(
          'routes.payment.failed_get_receipt',
          err.message
            ? err.errors
              ? JSON.stringify(err.errors)
              : 'Unknown error'
            : 'Unknown error',
        );
      }

      const data = (await res.json()) as TadawulGetTransactionReceiptResponse;

      return successResponse({ ...data }, 'routes.payment.receipt_retrieved');
    } catch (error) {
      throw new InternalServerErrorException(
        'routes.payment.failed_get_receipt',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
