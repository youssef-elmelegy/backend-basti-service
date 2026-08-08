import { TranslationService } from '@/common';
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { db } from '@/db';
import { coupons, couponUsages, regions } from '@/db/schema';
import { eq, and, sql, desc, getTableColumns } from 'drizzle-orm';
import { SuccessResponse, successResponse } from '@/utils';
import {
  CouponResponseDto,
  GenerateCouponDto,
  UpdateCouponDto,
  VerifyCouponDto,
} from '../dto/index';
import { handleErrorsAndThrow } from '@/utils/errors.util';
import { NotificationService } from '@/modules/notification/services/notification.service';

type FlattenedCoupon = Omit<typeof coupons.$inferSelect, 'name'> & {
  name: string;
  regionName?: string | null;
};

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(
    private readonly translationService: TranslationService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * RETURNING cannot join, so writes resolve the region name in a follow-up read.
   */
  private async attachRegionName(coupon: FlattenedCoupon): Promise<FlattenedCoupon> {
    if (!coupon.regionId) return { ...coupon, regionName: null };

    const [region] = await db
      .select({ name: this.translationService.getLocalized(regions.name, 'name') })
      .from(regions)
      .where(eq(regions.id, coupon.regionId))
      .limit(1);

    return { ...coupon, regionName: region?.name ?? null };
  }

  private async checkUsageLimits(couponId: string, userId: string) {
    try {
      const [coupon] = await db
        .select({
          id: coupons.id,
          regionId: coupons.regionId,
          usageLimitGlobal: coupons.usageLimitGlobal,
          usageLimitPerUser: coupons.usageLimitPerUser,
          isGlobal: coupons.isGlobal,
        })
        .from(coupons)
        .where(eq(coupons.id, couponId))
        .limit(1);

      if (!coupon) return false;

      if (coupon.usageLimitGlobal > 0) {
        const globalUsages = await db
          .select({ count: sql<number>`count(*)` })
          .from(couponUsages)
          .where(eq(couponUsages.couponId, couponId));

        if (Number(globalUsages[0].count) >= coupon.usageLimitGlobal) return false;
      }

      if (coupon.usageLimitPerUser > 0 && userId) {
        const userUsages = await db
          .select({ count: sql<number>`count(*)` })
          .from(couponUsages)
          .where(and(eq(couponUsages.couponId, couponId), eq(couponUsages.userId, userId)));
        if (Number(userUsages[0].count) >= coupon.usageLimitPerUser) return false;
      }

      return true;
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_check_usage_limits', this.logger);
    }
  }

  private async checkRegionLimits(couponId: string, regionId: string) {
    try {
      const [coupon] = await db
        .select({
          regionId: coupons.regionId,
          isGlobal: coupons.isGlobal,
        })
        .from(coupons)
        .where(and(eq(coupons.id, couponId), eq(coupons.regionId, regionId)))
        .limit(1);

      if (!coupon) return false;
      if (coupon.isGlobal) return true;
      return coupon.regionId === regionId;
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_check_region_limits', this.logger);
    }
  }

  async checkCodeExists(code: string): Promise<boolean> {
    try {
      const [existingCode] = await db.select().from(coupons).where(eq(coupons.code, code)).limit(1);
      return Boolean(existingCode);
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_check_code_exists', this.logger);
    }
  }

  async verify(verifyDto: VerifyCouponDto): Promise<SuccessResponse<CouponResponseDto>> {
    const { cartTotal, code, regionId, userId } = verifyDto;

    try {
      const [coupon] = await db
        .select({
          ...getTableColumns(coupons),
          name: this.translationService.getLocalized(coupons.name, 'name'),
          regionName: this.translationService.getLocalized(regions.name, 'regionName'),
        })
        .from(coupons)
        .leftJoin(regions, eq(coupons.regionId, regions.id))
        .where(and(eq(coupons.code, code), eq(coupons.isActive, true)))
        .limit(1);

      // Check if coupon exists
      if (!coupon) throw new NotFoundException('routes.coupons.not_found');

      const now = new Date().getTime();

      // check if coupon is valid for the cart total
      if (coupon.minOrderValue && cartTotal && coupon.minOrderValue > cartTotal)
        throw new BadRequestException('routes.coupons.invalid_cart_total');

      // check if coupon is in a valid timeframe
      if (coupon.startDate && new Date(coupon.startDate).getTime() > now)
        throw new BadRequestException('routes.coupons.invalid');
      if (coupon.expiryDate && new Date(coupon.expiryDate).getTime() < now)
        throw new BadRequestException('routes.coupons.expired');

      // check if coupon is active
      if (!coupon.isActive) throw new BadRequestException('routes.coupons.invalid');

      // check if coupon has hit a usage limit
      const usageValid = await this.checkUsageLimits(coupon.id, userId);
      if (!usageValid) throw new BadRequestException('routes.coupons.usage_limit_reached');

      // check if coupon is valid for the region
      if (regionId && !coupon.isGlobal) {
        const regionValid = await this.checkRegionLimits(coupon.id, regionId);
        if (!regionValid) throw new BadRequestException('routes.coupons.invalid_region');
      }

      return successResponse(this.formatCouponResponse(coupon), 'routes.coupons.verify');
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_verify', this.logger);
    }
  }

  async consume(couponId: string, userId: string): Promise<void> {
    try {
      await db.insert(couponUsages).values({
        couponId,
        userId,
        createdAt: new Date(),
      });
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_consume', this.logger);
    }
  }

  async applyCoupon(params: {
    code: string;
    userId: string;
    cartTotal: number;
    orderPrice: number;
    regionId?: string;
  }): Promise<{ finalPrice: number; discountAmount: number }> {
    const { code, userId, cartTotal, orderPrice, regionId } = params;

    try {
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(and(eq(coupons.code, code), eq(coupons.isActive, true)))
        .limit(1);

      // Check if coupon exists
      if (!coupon) throw new NotFoundException('routes.coupons.not_found');

      const now = new Date().getTime();

      // check if coupon is valid for the cart total
      if (coupon.minOrderValue && cartTotal && coupon.minOrderValue > cartTotal)
        throw new BadRequestException('routes.coupons.invalid_cart_total');

      // check if coupon is in a valid timeframe
      if (coupon.startDate && new Date(coupon.startDate).getTime() > now)
        throw new BadRequestException('routes.coupons.invalid');
      if (coupon.expiryDate && new Date(coupon.expiryDate).getTime() < now)
        throw new BadRequestException('routes.coupons.expired');

      // check if coupon is active
      if (!coupon.isActive) throw new BadRequestException('routes.coupons.invalid');

      // check if coupon has hit a usage limit
      const usageValid = await this.checkUsageLimits(coupon.id, userId);
      if (!usageValid) throw new BadRequestException('routes.coupons.usage_limit_reached');

      // check if coupon is valid for the region
      if (regionId) {
        const regionValid = await this.checkRegionLimits(coupon.id, regionId);
        if (!regionValid) throw new BadRequestException('routes.coupons.invalid_region');
      }

      // Consume it
      await this.consume(coupon.id, userId);

      // Calculate the new price
      let discountAmount = 0;
      const discountValue = parseFloat(coupon.discountValue);

      if (coupon.discountType === 'percentage') {
        discountAmount = (orderPrice * discountValue) / 100;
      } else if (coupon.discountType === 'fixed_amount') {
        discountAmount = discountValue;
      }

      // Don't allow discount to exceed the order price
      if (discountAmount > orderPrice) {
        discountAmount = orderPrice;
      }

      const finalPrice = Math.max(0, orderPrice - discountAmount);

      return { finalPrice, discountAmount };
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_apply', this.logger);
    }
  }

  async generate(data: GenerateCouponDto): Promise<SuccessResponse<CouponResponseDto>> {
    try {
      const nameObject = await this.translationService.getTranslationObject(data.name);

      const existingCode = await this.checkCodeExists(data.code);

      if (existingCode) {
        throw new BadRequestException('routes.coupons.code_exists');
      }

      const [coupon] = await db
        .insert(coupons)
        .values({
          code: data.code,
          name: nameObject,
          discountType: data.discountType as any,
          discountValue: data.discountValue.toString() as any,
          minOrderValue: data.minOrderValue,
          maxDiscountValue: data.maxDiscountValue || null,
          startDate: data.startDate ? new Date(data.startDate) : null,
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
          usageLimitGlobal: data.usageLimitGlobal || 0,
          usageLimitPerUser: data.usageLimitPerUser || 0,
          isGlobal: data.isGlobal ?? true,
          isActive: data.isActive ?? true,
          regionId: data.regionId || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({
          ...getTableColumns(coupons),
          name: this.translationService.getLocalized(coupons.name, 'name'),
        });

      if (coupon.isActive) {
        await this.notificationService.broadcastToAllUsers({
          titleKey: 'notification_templates.coupon.title',
          bodyKey: 'notification_templates.coupon.body',
          args: { code: coupon.code },
          type: 'coupon',
          redirectId: coupon.id,
          data: { couponId: coupon.id, code: coupon.code },
        });
      }

      return successResponse(
        this.formatCouponResponse(await this.attachRegionName(coupon)),
        'routes.coupons.generated',
        HttpStatus.CREATED,
      );
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_generate', this.logger);
    }
  }

  async getAll(): Promise<SuccessResponse<CouponResponseDto[]>> {
    try {
      const result = await db
        .select({
          ...getTableColumns(coupons),
          name: this.translationService.getLocalized(coupons.name, 'name'),
          regionName: this.translationService.getLocalized(regions.name, 'regionName'),
        })
        .from(coupons)
        .leftJoin(regions, eq(coupons.regionId, regions.id))
        .orderBy(desc(coupons.createdAt));
      return successResponse(
        result.map((coupon) => this.formatCouponResponse(coupon)),
        'routes.coupons.list_retrieved',
      );
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_list', this.logger);
    }
  }

  async getOne(id: string): Promise<SuccessResponse<CouponResponseDto>> {
    try {
      const [coupon] = await db
        .select({
          ...getTableColumns(coupons),
          name: this.translationService.getLocalized(coupons.name, 'name'),
          regionName: this.translationService.getLocalized(regions.name, 'regionName'),
        })
        .from(coupons)
        .leftJoin(regions, eq(coupons.regionId, regions.id))
        .where(eq(coupons.id, id))
        .limit(1);

      if (!coupon) throw new NotFoundException('routes.coupons.not_found');
      return successResponse(this.formatCouponResponse(coupon), 'routes.coupons.retrieved');
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_retrieve', this.logger);
    }
  }

  async update(id: string, data: UpdateCouponDto): Promise<SuccessResponse<CouponResponseDto>> {
    try {
      const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);

      if (!coupon) throw new NotFoundException('routes.coupons.not_found');

      // Codes are unique; reject a clash up front instead of surfacing a raw
      // constraint violation as a 500.
      if (data.code !== undefined && data.code !== coupon.code) {
        const [clash] = await db
          .select({ id: coupons.id })
          .from(coupons)
          .where(eq(coupons.code, data.code))
          .limit(1);

        if (clash) throw new BadRequestException('routes.coupons.code_exists');
      }

      const updateData: Record<string, any> = { updatedAt: new Date() };

      if (data.code !== undefined) updateData.code = data.code;
      if (data.discountType !== undefined) updateData.discountType = data.discountType;
      if (data.discountValue !== undefined)
        updateData.discountValue = data.discountValue.toString();
      if (data.minOrderValue !== undefined) updateData.minOrderValue = data.minOrderValue;
      if (data.maxDiscountValue !== undefined)
        updateData.maxDiscountValue = data.maxDiscountValue ?? null;
      if (data.startDate !== undefined)
        updateData.startDate = data.startDate ? new Date(data.startDate) : null;
      if (data.expiryDate !== undefined)
        updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
      if (data.usageLimitGlobal !== undefined) updateData.usageLimitGlobal = data.usageLimitGlobal;
      if (data.usageLimitPerUser !== undefined)
        updateData.usageLimitPerUser = data.usageLimitPerUser;
      if (data.isGlobal !== undefined) updateData.isGlobal = data.isGlobal;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.regionId !== undefined) updateData.regionId = data.regionId || null;

      // A global coupon is not scoped to a region; drop any stale region link.
      if (updateData.isGlobal === true) updateData.regionId = null;

      if (data.name) {
        const nameObject = await this.translationService.getTranslationObject(data.name);
        updateData.name = nameObject;
      }

      const [updatedCoupon] = await db
        .update(coupons)
        .set({
          ...updateData,
        })
        .where(eq(coupons.id, id))
        .returning({
          ...getTableColumns(coupons),
          name: this.translationService.getLocalized(coupons.name, 'name'),
        });

      return successResponse(
        this.formatCouponResponse(await this.attachRegionName(updatedCoupon)),
        'routes.coupons.updated',
        HttpStatus.OK,
      );
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_update', this.logger);
    }
  }

  async toggleStatus(id: string): Promise<SuccessResponse<CouponResponseDto>> {
    try {
      const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);

      if (!coupon) throw new NotFoundException('routes.coupons.not_found');

      const [updatedCoupon] = await db
        .update(coupons)
        .set({
          isActive: !coupon.isActive,
          updatedAt: new Date(),
        })
        .where(eq(coupons.id, id))
        .returning({
          ...getTableColumns(coupons),
          name: this.translationService.getLocalized(coupons.name, 'name'),
        });

      return successResponse(
        this.formatCouponResponse(await this.attachRegionName(updatedCoupon)),
        'routes.coupons.toggled',
        HttpStatus.OK,
      );
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_toggle', this.logger);
    }
  }

  async delete(id: string): Promise<SuccessResponse<{ message: string }>> {
    try {
      const [coupon] = await db
        .select({
          id: coupons.id,
        })
        .from(coupons)
        .where(eq(coupons.id, id))
        .limit(1);

      if (!coupon) throw new NotFoundException('routes.coupons.not_found');

      await db.delete(coupons).where(eq(coupons.id, id));

      return successResponse(
        {
          message: 'routes.coupons.deleted',
        },
        'routes.coupons.deleted',
      );
    } catch (error) {
      handleErrorsAndThrow(error, 'routes.coupons.failed_delete', this.logger);
    }
  }

  private formatCouponResponse(coupon: FlattenedCoupon): CouponResponseDto {
    return {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      discountType: coupon.discountType,
      discountValue: parseFloat(coupon.discountValue),
      minOrderValue: coupon.minOrderValue ?? undefined,
      maxDiscountValue: coupon.maxDiscountValue ?? undefined,
      startDate: coupon.startDate,
      expiryDate: coupon.expiryDate,
      usageLimitGlobal: coupon.usageLimitGlobal,
      usageLimitPerUser: coupon.usageLimitPerUser,
      regionId: coupon.regionId,
      regionName: coupon.regionName ?? null,
      isGlobal: coupon.isGlobal,
      isActive: coupon.isActive,
      createdAt: coupon.createdAt,
      updatedAt: coupon.updatedAt,
    };
  }
}
