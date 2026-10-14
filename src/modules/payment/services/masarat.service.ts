import {
  BadRequestException,
  Injectable,
  Inject,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { env } from '@/env';
import {
  MasaratBank,
  MasaratCompleteSessionResponse,
  MasaratOpenSessionResponse,
  MasaratSigninResponse,
} from '../dto/masarat.dto';
import { handleErrorsAndThrow, successResponse } from '@/utils';
import { orders } from '@/db/schema/order';
import { eq } from 'drizzle-orm/sql/expressions/conditions';
import { db } from '@/db';
import { appConfig } from '@/db/schema';
import {
  MASARAT_TRADE_BANK,
  MASARAT_REPUBLIC_BANK,
  MASARAT_SAHARI_BANK,
} from '../masarat.constants';
import type { AxiosInstance } from 'axios';

@Injectable()
export class MasaratService {
  private readonly logger = new Logger(MasaratService.name);
  private static readonly DEFAULT_PAYMENT_FEE = 0.01; // 1% fee

  constructor(
    @Inject(MASARAT_TRADE_BANK)
    private readonly tradeBankClient: AxiosInstance,

    @Inject(MASARAT_REPUBLIC_BANK)
    private readonly republicBankClient: AxiosInstance,

    @Inject(MASARAT_SAHARI_BANK)
    private readonly sahariBankClient: AxiosInstance,
  ) {}

  async signin(bank: MasaratBank) {
    this.logger.log(`Signing in to Masarat with bank: ${bank}`);

    try {
      const { data } =
        bank === 'trade'
          ? await this.tradeBankClient.post<MasaratSigninResponse>(
              `${env.MASARAT_TRADE_BANK_URL}/Signin`,
              {
                userId: env.MASARAT_TRADE_BANK_USER_ID,
                pin: env.MASARAT_TRADE_BANK_PIN,
                providerId: env.MASARAT_TRADE_BANK_PROVIDER_ID,
                authUserType: 0,
              },
            )
          : bank === 'republic'
            ? await this.republicBankClient.post<MasaratSigninResponse>(
                `${env.MASARAT_REPUBLIC_BANK_URL}/Signin`,
                {
                  userId: env.MASARAT_REPUBLIC_BANK_USER_ID,
                  pin: env.MASARAT_REPUBLIC_BANK_PIN,
                  providerId: env.MASARAT_REPUBLIC_BANK_PROVIDER_ID,
                  authUserType: 0,
                },
              )
            : await this.sahariBankClient.post<MasaratSigninResponse>(
                `${env.MASARAT_SAHARI_BANK_URL}/Signin`,
                {
                  userId: env.MASARAT_SAHARI_BANK_USER_ID,
                  pin: env.MASARAT_SAHARI_BANK_PIN,
                  providerId: env.MASARAT_SAHARI_BANK_PROVIDER_ID,
                  authUserType: 0,
                },
              );
      if (data.type !== 1) {
        const err = `Failed to sign in to Masarat: ${JSON.stringify(data)}`;
        this.logger.error(err);

        throw new InternalServerErrorException('routes.payment.failed_sign_in', err);
      }

      this.logger.log(`Masarat sign in successful`);
      return successResponse(data, 'routes.payment.payment_signed_in');
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.payment.failed_sign_in', this.logger);
    }
  }

  async openSession(
    bank: MasaratBank,
    orderId: string,
    userId: string,
    cardNumber: string,
    token: string,
  ) {
    try {
      this.logger.log(`Opening session with Masarat with bank: ${bank}`);

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

      const body = {
        amount: Number(order.finalPrice),
        identityCard: cardNumber,
        transactionId: order.id,
        onlineOperation: 1, // 1=Sell, 2=Recover
      };
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const { data } =
        bank === 'trade'
          ? await this.tradeBankClient.post<MasaratOpenSessionResponse>(
              `${env.MASARAT_TRADE_BANK_URL}/OpenSession`,
              body,
              { headers },
            )
          : bank === 'republic'
            ? await this.republicBankClient.post<MasaratOpenSessionResponse>(
                `${env.MASARAT_REPUBLIC_BANK_URL}/OpenSession`,
                body,
                { headers },
              )
            : await this.sahariBankClient.post<MasaratOpenSessionResponse>(
                `${env.MASARAT_SAHARI_BANK_URL}/OpenSession`,
                body,
                { headers },
              );
      // const { data } = await firstValueFrom(
      //   this.httpService.post<MasaratOpenSessionResponse>(
      //     `${env.MASARAT_URL}/OpenSession`,
      //     {
      //       amount: Number(order.finalPrice),
      //       identityCard: cardNumber,
      //       transactionId: order.id,
      //       onlineOperation: 1, // 1=Sell, 2=Recover
      //     },
      //     {
      //       headers: {
      //         Authorization: `Bearer ${token}`,
      //       },
      //     },
      //   ),
      // );

      if (data.type !== 1) {
        const err = `Failed to open session with Masarat: ${JSON.stringify(data)}`;
        this.logger.error(err);
        throw new InternalServerErrorException('routes.payment.failed_open_session', err);
      }

      return successResponse(data, 'routes.payment.payment_session_opened');
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.payment.failed_open_session', this.logger);
    }
  }

  async completeSession(bank: MasaratBank, orderId: string, otp: string, token: string) {
    try {
      this.logger.log(`Completing session with Masarat with bank: ${bank}`);

      let paymentFee = MasaratService.DEFAULT_PAYMENT_FEE; // default to 1% fee
      const [config] = await db
        .select({
          paymentFee: appConfig.paymentFee,
        })
        .from(appConfig)
        .limit(1);

      if (config && config.paymentFee.masarat) {
        paymentFee = config.paymentFee.masarat;
      } else {
        this.logger.warn('No config found, defaulting to 1% fee');
      }

      const body = {
        otp: otp,
      };
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const { data } =
        bank === 'trade'
          ? await this.tradeBankClient.post<MasaratCompleteSessionResponse>(
              `${env.MASARAT_TRADE_BANK_URL}/CompleteSession`,
              body,
              { headers },
            )
          : bank === 'republic'
            ? await this.republicBankClient.post<MasaratCompleteSessionResponse>(
                `${env.MASARAT_REPUBLIC_BANK_URL}/CompleteSession`,
                body,
                { headers },
              )
            : await this.sahariBankClient.post<MasaratCompleteSessionResponse>(
                `${env.MASARAT_SAHARI_BANK_URL}/CompleteSession`,
                body,
                { headers },
              );
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
            paymentGatewayFee: paymentFee,
          },
        })
        .where(eq(orders.id, orderId));

      return successResponse(data, 'routes.payment.payment_session_completed');
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.payment.failed_complete_session', this.logger);
    }
  }
}
