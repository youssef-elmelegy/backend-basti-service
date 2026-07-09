import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { env } from '@/env';
import {
  MasaratCompleteSessionResponse,
  MasaratOpenSessionResponse,
  MasaratSigninResponse,
} from '../dto/masarat.dto';
import { handleErrorsAndThrow, successResponse } from '@/utils';
import { orders } from '@/db/schema/order';
import { eq } from 'drizzle-orm/sql/expressions/conditions';
import { db } from '@/db';

@Injectable()
export class MasaratService {
  private readonly logger = new Logger(MasaratService.name);

  async signin() {
    try {
      const res = await fetch(`${env.MASARAT_URL}/Signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: env.MASARAT_USER_ID,
          pin: env.MASARAT_PIN,
          providerId: env.MASARAT_PROVIDER_ID,
          authUserType: 0,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        this.logger.error(`Failed to sign in to Masarat: ${JSON.stringify(err)}`);
        throw new InternalServerErrorException('routes.payment.failed_sign_in', err);
      }

      const data = (await res.json()) as MasaratSigninResponse;

      if (data.type !== 1) {
        const err = `Failed to sign in to Masarat: ${JSON.stringify(data)}`;
        this.logger.error(err);
        throw new InternalServerErrorException('routes.payment.failed_sign_in', err);
      }

      this.logger.log(`Masarat sign in successful`);
      return successResponse(data, 'routes.payment.payment_signed_in');
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.payment.payment_initiated', this.logger);
    }
  }

  async openSession(orderId: string, userId: string, cardNumber: string, token: string) {
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

      const res = await fetch(`${env.MASARAT_URL}/OpenSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(order.finalPrice),
          identityCard: cardNumber, // 9-digit number (10-digit for Trade and Development Bank)
          transactionId: order.id,
          onlineOperation: 1, // 1=Sell, 2=Recover
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        this.logger.error(`Failed to open session with Masarat: ${JSON.stringify(err)}`);
        throw new InternalServerErrorException('routes.payment.failed_open_session', err);
      }

      const data = (await res.json()) as MasaratOpenSessionResponse;

      if (data.type !== 1) {
        const err = `Failed to open session with Masarat: ${JSON.stringify(data)}`;
        this.logger.error(err);
        throw new InternalServerErrorException('routes.payment.failed_open_session', err);
      }

      return successResponse(data, 'routes.payment.payment_open_session');
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.payment.payment_initiated', this.logger);
    }
  }

  async completeSession(orderId: string, otp: string, token: string) {
    try {
      const res = await fetch(`${env.MASARAT_URL}/CompleteSession`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          otp: otp,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        this.logger.error(`Failed to complete session with Masarat: ${JSON.stringify(err)}`);
        throw new InternalServerErrorException('routes.payment.failed_complete_session', err);
      }

      const data = (await res.json()) as MasaratCompleteSessionResponse;

      if (data.type !== 1) {
        if (data.type === 2) {
          const err = `OTP incorrect: ${JSON.stringify(data)}`;
          this.logger.error(err);
          throw new BadRequestException('routes.payment.otp_invalid', err);
        } else {
          const err = `Failed to complete session with Masarat: ${JSON.stringify(data)}`;
          this.logger.error(err);
          throw new InternalServerErrorException('routes.payment.failed_complete_session', err);
        }
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
            paymentGatewayName: 'masarat',
            paymentGatewaySubName: '',
            paymentGatewayRef: data.traceId,
          },
        })
        .where(eq(orders.id, orderId));

      return successResponse(data, 'routes.payment.payment_complete_session');
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.payment.payment_initiated', this.logger);
    }
  }
}
