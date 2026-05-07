import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { db } from '@/db';
import { paymentMethods } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  PaymentMethodDataDto,
  DeletePaymentMethodResponseDto,
} from '../dto';

@Injectable()
export class PaymentMethodService {
  private readonly logger = new Logger(PaymentMethodService.name);

  async create(
    userId: string,
    createDto: CreatePaymentMethodDto,
  ): Promise<SuccessResponse<PaymentMethodDataDto>> {
    try {
      if (createDto.isDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false })
          .where(eq(paymentMethods.userId, userId));
      }

      const [newPaymentMethod] = await db
        .insert(paymentMethods)
        .values({
          userId,
          type: createDto.type,
          cardHolderName: createDto.cardHolderName,
          cardLastFourDigits: createDto.cardLastFourDigits,
          cardExpiryMonth: createDto.cardExpiryMonth,
          cardExpiryYear: createDto.cardExpiryYear,
          isDefault: createDto.isDefault ?? false,
        })
        .returning();

      this.logger.log(`Payment method created: ${newPaymentMethod.id} for user: ${userId}`);

      return successResponse(
        this.mapToPaymentMethodResponse(newPaymentMethod),
        'routes.payment-method.created',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Payment method creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.payment-method.failed_create',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(userId: string): Promise<SuccessResponse<PaymentMethodDataDto[]>> {
    try {
      const userPaymentMethods = await db
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.userId, userId))
        .orderBy(paymentMethods.createdAt);

      this.logger.debug(
        `Retrieved ${userPaymentMethods.length} payment methods for user: ${userId}`,
      );

      return successResponse(
        userPaymentMethods.map((pm) => this.mapToPaymentMethodResponse(pm)),
        'routes.payment-method.list_retrieved',
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve payment methods: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.payment-method.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string, userId: string): Promise<SuccessResponse<PaymentMethodDataDto>> {
    try {
      const paymentMethod = await this.findPaymentMethodOrFail(id, userId);

      this.logger.debug(`Retrieved payment method: ${id}`);

      return successResponse(
        this.mapToPaymentMethodResponse(paymentMethod),
        'routes.payment-method.retrieved',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve payment method: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.payment-method.failed_retrieve',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdatePaymentMethodDto,
  ): Promise<SuccessResponse<PaymentMethodDataDto>> {
    try {
      await this.findPaymentMethodOrFail(id, userId);

      // If this is being set as default, unset other defaults first
      if (updateDto.isDefault) {
        await db
          .update(paymentMethods)
          .set({ isDefault: false })
          .where(eq(paymentMethods.userId, userId));
      }

      const [updated] = await db
        .update(paymentMethods)
        .set({
          ...(updateDto.type !== undefined && { type: updateDto.type }),
          ...(updateDto.cardHolderName !== undefined && {
            cardHolderName: updateDto.cardHolderName,
          }),
          ...(updateDto.cardLastFourDigits !== undefined && {
            cardLastFourDigits: updateDto.cardLastFourDigits,
          }),
          ...(updateDto.cardExpiryMonth !== undefined && {
            cardExpiryMonth: updateDto.cardExpiryMonth,
          }),
          ...(updateDto.cardExpiryYear !== undefined && {
            cardExpiryYear: updateDto.cardExpiryYear,
          }),
          ...(updateDto.isDefault !== undefined && { isDefault: updateDto.isDefault }),
          updatedAt: new Date(),
        })
        .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId)))
        .returning();

      this.logger.log(`Payment method updated: ${id}`);

      return successResponse(
        this.mapToPaymentMethodResponse(updated),
        'routes.payment-method.updated',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to update payment method: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.payment-method.failed_update',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(
    id: string,
    userId: string,
  ): Promise<SuccessResponse<DeletePaymentMethodResponseDto>> {
    try {
      await this.findPaymentMethodOrFail(id, userId);

      await db
        .delete(paymentMethods)
        .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId)));

      this.logger.log(`Payment method deleted: ${id}`);

      return successResponse(
        { message: 'routes.payment-method.deleted' },
        'routes.payment-method.deleted',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete payment method: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.payment-method.failed_delete',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private async findPaymentMethodOrFail(id: string, userId: string) {
    const [paymentMethod] = await db
      .select()
      .from(paymentMethods)
      .where(and(eq(paymentMethods.id, id), eq(paymentMethods.userId, userId)))
      .limit(1);

    if (!paymentMethod) {
      throw new NotFoundException(
        errorResponse(
          `routes.payment-method.not_found_with_id`,
          HttpStatus.NOT_FOUND,
          'NotFoundException',
          { paymentMethodId: id },
        ),
      );
    }

    return paymentMethod;
  }

  private mapToPaymentMethodResponse(
    paymentMethod: typeof paymentMethods.$inferSelect,
  ): PaymentMethodDataDto {
    return {
      id: paymentMethod.id,
      type: paymentMethod.type,
      cardHolderName: paymentMethod.cardHolderName,
      cardLastFourDigits: paymentMethod.cardLastFourDigits,
      cardExpiryMonth: paymentMethod.cardExpiryMonth,
      cardExpiryYear: paymentMethod.cardExpiryYear,
      isDefault: paymentMethod.isDefault,
      createdAt: paymentMethod.createdAt,
      updatedAt: paymentMethod.updatedAt,
    };
  }
}
