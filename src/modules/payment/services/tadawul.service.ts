import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { env } from '@/env';
import { appConfig, orders } from '@/db/schema';
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
import { handleErrorsAndThrow, SuccessResponse, successResponse } from '@/utils';
import { isUUID } from 'class-validator';

@Injectable()
export class TadawulService {
  private readonly logger = new Logger(TadawulService.name);
  private static readonly DEFAULT_PAYMENT_FEE = 0.015; // 1.5% fee

  async initiatePayment(
    orderId: string,
    userId: string,
    successUrl?: string,
    failureUrl?: string,
    forcedPhoneNumber?: string,
  ): Promise<SuccessResponse<InitiatePaymentResponse>> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

      if (!order) {
        throw new NotFoundException('routes.orders.not_found');
      }

      if (order.userId !== userId) {
        throw new NotFoundException('routes.payment.invalid_order_user');
      }

      if (order.orderStatus !== null) {
        throw new BadRequestException('routes.payment.order_already_paid');
      }

      /**
       * consturct a ref with the orderId and a timestamp to allow
       * the client to retry the payment if it fails,
       * because the gatway rejects payments with the same custom_ref
       * even if the payment fails.
       */
      const now = new Date().getTime();
      const ref = `${order.id}@t=${now}`;

      const res = await fetch(`${env.TADAWUL_URL}/payment/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${env.TADAWUL_TOKEN}`,
        },
        body: JSON.stringify({
          id: env.TADAWUL_ID,
          amount: order.finalPrice,
          phone: forcedPhoneNumber || order.userData.phoneNumber,
          email: order.userData.email,
          custom_ref: ref,
          backend_url: env.TADAWUL_WEBHOOK_URL,
          frontend_url: successUrl || '',
          failed_front_end_url: failureUrl || '',
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as TadawulError;
        throw new BadRequestException(
          err.message,
          err.errors ? JSON.stringify(err.errors) : 'Unknown error',
        );
      }

      const data = (await res.json()) as TadawulInitiatePaymentResponse;

      return successResponse(
        {
          url: data.url,
          orderId: order.id,
          ref,
        },
        'routes.payment.payment_initiated',
      );
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.payment.payment_initiated', this.logger);
    }
  }

  async confirmPayment(body: ConfirmPaymentWebhookDto) {
    this.logger.log(`Confirming payment with ref: ${body.custom_ref}`);

    const {
      result,
      amount,
      charges,
      net_amount,
      store_id,
      our_ref,
      payment_method_en,
      custom_ref,
    } = body;

    try {
      if (result.toLowerCase() !== 'success') {
        const err = `Payment status is not success, result: ${result}`;
        this.logger.error(err);
        throw new BadRequestException(err);
      }

      this.logger.log('Payment status is success');

      let paymentFee = TadawulService.DEFAULT_PAYMENT_FEE; // default to 1.5% fee

      const [config] = await db
        .select({
          paymentFee: appConfig.paymentFee,
        })
        .from(appConfig)
        .limit(1);

      if (config && config.paymentFee.tadawul) {
        paymentFee = config.paymentFee.tadawul;
      } else {
        this.logger.warn('No config found, defaulting to 1% fee');
      }

      // strip timestamp from the ref to get the orderId
      const resolvedOrderId = custom_ref.split('@')[0];

      if (!isUUID(resolvedOrderId)) {
        const err = `Invalid orderId extracted from custom_ref: ${resolvedOrderId}`;
        this.logger.error(err);
        throw new BadRequestException(err);
      }

      this.logger.log(`Resolved orderId: ${resolvedOrderId}`);

      const [order] = await db.select().from(orders).where(eq(orders.id, resolvedOrderId)).limit(1);

      if (!order) {
        const err = `Order not found for id: ${resolvedOrderId}`;
        this.logger.error(err);
        throw new NotFoundException(err);
      }

      if (store_id !== env.TADAWUL_ID) {
        const err = `Store ID mismatch`;
        this.logger.error(err);
        throw new BadRequestException(err);
      }

      const parsedAmount = parseFloat(amount);
      const parsedFinalPrice = parseFloat(order.finalPrice);

      if (parsedAmount !== parsedFinalPrice) {
        const err = `Amount mismatch, expected: ${parsedFinalPrice}, received: ${parsedAmount}`;
        this.logger.error(err);
        throw new BadRequestException(err);
      }

      await db
        .update(orders)
        .set({
          orderStatus: 'pending',
          paymentData: {
            type: '',
            cardHolderName: '',
            cardLastFourDigits: '',
            cardExpiryMonth: 0,
            cardExpiryYear: 0,
            paymentGatewayName: 'tadawul',
            paymentGatewaySubName: payment_method_en,
            paymentGatewayRef: our_ref,
            paymentGatewayFee: paymentFee,
          },
        })
        .where(eq(orders.id, resolvedOrderId))
        .returning();

      this.logger.log(
        `Order ${resolvedOrderId} confirmed successfully, amount: ${amount}, charges: ${charges}, net_amount: ${net_amount}`,
      );
      return successResponse({});
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.payment.failed_confirm_payment', this.logger);
    }
  }

  async getTransactionReceipt(
    ref: string,
  ): Promise<SuccessResponse<GetTransactionReceiptResponse>> {
    try {
      // strip timestamp from the ref to get the orderId
      const resolvedOrderId = ref.split('@')[0];

      if (!isUUID(resolvedOrderId)) {
        const err = `Invalid orderId extracted from custom_ref: ${resolvedOrderId}`;
        this.logger.error(err);
        throw new BadRequestException(err);
      }

      const [order] = await db.select().from(orders).where(eq(orders.id, resolvedOrderId)).limit(1);

      if (!order) {
        throw new NotFoundException('routes.orders.not_found');
      }

      const res = await fetch(`${env.TADAWUL_URL}/receipt/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${env.TADAWUL_TOKEN}`,
        },
        body: JSON.stringify({
          store_id: env.TADAWUL_ID,
          custom_ref: ref,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as TadawulError;
        throw new BadRequestException(
          err.message,
          err.errors ? JSON.stringify(err.errors) : 'Unknown error',
        );
      }

      const data = (await res.json()) as TadawulGetTransactionReceiptResponse;

      return successResponse({ ...data }, 'routes.payment.receipt_retrieved');
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.payment.payment_initiated', this.logger);
    }
  }
}
