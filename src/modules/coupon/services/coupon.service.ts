import { TranslationService } from '@/common';
import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { db } from '@/db';
import { coupons, couponUsages } from '@/db/schema';
import { eq, and, sql, desc, getTableColumns } from 'drizzle-orm';
import { errorResponse, SuccessResponse, successResponse } from '@/utils';
import { CouponResponse, GenerateCouponDto, UpdateCouponDto, VerifyCouponDto } from '../dto/index';
import { handleErrors } from '@/utils/errors.util';

type FlattenedCoupon = Omit<typeof coupons.$inferSelect, 'name'> & { 
	name: string; 
};

@Injectable()
export class CouponService {
	private readonly logger = new Logger(CouponService.name);

	constructor(private readonly translationService: TranslationService) {}

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
					.where(and(
						eq(couponUsages.couponId, couponId),
						eq(couponUsages.userId, userId),
					));
				if (Number(userUsages[0].count) >= coupon.usageLimitPerUser) return false;
			}
	
			return true;
		}
		catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Failed to check coupon usage limits: ${errMsg}`);
			return false;
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
				.where(and(
					eq(coupons.id, couponId),
					eq(coupons.regionId, regionId), 
				))
				.limit(1);

			if (!coupon) return false;
			if (coupon.isGlobal) return true;
			return coupon.regionId === regionId;
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Failed to check coupon region limits: ${errMsg}`);
			return false;
		}
		
	}

	async checkCodeExists(code: string): Promise<boolean> {
		try {
			const [existingCode] = await db
				.select()
				.from(coupons)
				.where(eq(coupons.code, code))
				.limit(1);
			return Boolean(existingCode);
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Failed to check coupon code exists: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.coupons.failed_to_check_code',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async verify(verifyDto: VerifyCouponDto, userId: string): Promise<SuccessResponse<{ message: string }>> {
		
		const {
			cartTotal,
			code,
			regionId,
		} = verifyDto;

		try {
			const [coupon] = await db
				.select({
					...getTableColumns(coupons),
					name: this.translationService.getLocalized(coupons.name, 'name'),
				})
				.from(coupons)
				.where(and(eq(coupons.code, code), eq(coupons.isActive, true)))
				.limit(1);

			// Check if coupon exists
			if (!coupon) 
				throw new NotFoundException('routes.coupons.not_found');

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
			if (!coupon.isActive) 
				throw new BadRequestException('routes.coupons.invalid');

			// check if coupon has hit a usage limit
			const usageValid = await this.checkUsageLimits(coupon.id, userId);
			if (!usageValid) 
				throw new BadRequestException('routes.coupons.usage_limit_reached');

			// check if coupon is valid for the region
			if (regionId && !coupon.isGlobal) {
				const regionValid = await this.checkRegionLimits(coupon.id, regionId);
				if (!regionValid) 
					throw new BadRequestException('routes.coupons.invalid_region');
			}

			return successResponse(
				{
					message: 'routes.coupons.verify',
				},
				'routes.coupons.verify',
			);

		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Coupon verification error: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.coupons.verify_failed',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async consume(couponId: string, userId: string, orderId: string): Promise<void> {
		try {
			await db.insert(couponUsages).values({
				couponId,
				userId,
				orderId,
				createdAt: new Date(),
			});
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Failed to consume coupon: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.coupons.failed_consume',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async applyCoupon(params: {
		code: string;
		userId: string;
		orderId: string;
		cartTotal: number;
		orderPrice: number;
		regionId?: string;
	}): Promise<{ finalPrice: number; discountAmount: number }> {
		const { code, userId, orderId, cartTotal, orderPrice, regionId } = params;

		try {
			const [coupon] = await db
				.select()
				.from(coupons)
				.where(and(eq(coupons.code, code), eq(coupons.isActive, true)))
				.limit(1);

			// Check if coupon exists
			if (!coupon) 
				throw new NotFoundException('routes.coupons.not_found');

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
			if (!coupon.isActive) 
				throw new BadRequestException('routes.coupons.invalid');

			// check if coupon has hit a usage limit
			const usageValid = await this.checkUsageLimits(coupon.id, userId);
			if (!usageValid) 
				throw new BadRequestException('routes.coupons.usage_limit_reached');

			// check if coupon is valid for the region
			if (regionId) {
				const regionValid = await this.checkRegionLimits(coupon.id, regionId);
				if (!regionValid) 
					throw new BadRequestException('routes.coupons.invalid_region');
			}

			// Consume it
			await this.consume(coupon.id, userId, orderId);

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
			const errMsg = handleErrors(error);
			this.logger.error(`Coupon application error: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.coupons.apply_failed',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async generate(
		data: GenerateCouponDto,
	): Promise<SuccessResponse<CouponResponse>> {
		try {
			const nameObject = await this.translationService.getTranslationObject(data.name);

			const existingCode = await this.checkCodeExists(data.code);

			if (existingCode) {
				throw new BadRequestException('routes.coupons.code_exists');
			}

			const [coupon] = await db.insert(coupons).values({
				code: data.code,
				name: nameObject,
				discountType: data.discountType as any,
				discountValue: data.discountValue.toString() as any,
				minOrderValue: data.minOrderValue,
				startDate: data.startDate ? new Date(data.startDate) : null,
				expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
				usageLimitGlobal: data.usageLimitGlobal || 0,
				usageLimitPerUser: data.usageLimitPerUser || 0,
				isGlobal: data.isGlobal ?? true,
				isActive: data.isActive ?? true,
				regionId: data.regionId || null,
				createdAt: new Date(),
				updatedAt: new Date(),
			}).returning({
				...getTableColumns(coupons),
				name: this.translationService.getLocalized(coupons.name, 'name'),
			});

			return successResponse(
				this.formatCouponResponse(coupon),
				'routes.coupons.generated',
				HttpStatus.CREATED,
			);
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Coupon generation error: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.coupons.failed_generate',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async getAll(): Promise<SuccessResponse<CouponResponse[]>> {
		try {
			const result = await db
				.select({
					...getTableColumns(coupons),
					name: this.translationService.getLocalized(coupons.name, 'name'),
				})
				.from(coupons)
				.orderBy(desc(coupons.createdAt));
			return successResponse(
				result.map((coupon) => this.formatCouponResponse(coupon)),
				'routes.coupons.list_retrieved', 
		);
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Coupon retrieval error: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.coupons.failed_list',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async getOne(id: string): Promise<SuccessResponse<CouponResponse>> {
		try {
			const [coupon] = await db
				.select({
					...getTableColumns(coupons),
					name: this.translationService.getLocalized(coupons.name, 'name'),
				})
				.from(coupons)
				.where(eq(coupons.id, id))
				.limit(1);

			if (!coupon) throw new NotFoundException('routes.coupons.not_found');
			return successResponse(this.formatCouponResponse(coupon), 'routes.coupons.retrieved');
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Failed to retrieve coupon: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.coupons.failed_retrieve',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async update(id: string, data: UpdateCouponDto): Promise<SuccessResponse<CouponResponse>> {
		try {
			const [coupon] = await db
			.select()
			.from(coupons)
			.where(eq(coupons.id, id))
			.limit(1);
			
			if (!coupon) throw new NotFoundException('routes.coupons.not_found');

			const updateData: Record<string, any> = {};
			
			for (const key in data) {
				if (data[key] !== undefined) {
					updateData[key] = data[key];
				}
			}

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
				this.formatCouponResponse(updatedCoupon),
				'routes.coupons.updated',
				HttpStatus.OK,
			);
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Coupon update error: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.coupons.failed_update',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async toggleStatus(id: string): Promise<SuccessResponse<CouponResponse>> {
		try {
			const [coupon] = await db
				.select()
				.from(coupons)
				.where(eq(coupons.id, id))
				.limit(1);

			if (!coupon) throw new NotFoundException('routes.coupons.not_found');

			const [updatedCoupon] = await db.update(coupons)
				.set({
					isActive: !coupon.isActive,
					updatedAt: new Date()
				})
				.where(eq(coupons.id, id))
				.returning({
					...getTableColumns(coupons),
					name: this.translationService.getLocalized(coupons.name, 'name'),
				});

			return successResponse(
				this.formatCouponResponse(updatedCoupon),
				'routes.coupons.toggled',
				HttpStatus.OK,
			);
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Coupon status toggle error: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.coupons.failed_toggle',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
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
				'routes.coupons.deleted'
			);
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Failed to delete coupon: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.coupons.failed_delete',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	private formatCouponResponse(coupon: FlattenedCoupon): CouponResponse {
		return {
			id: coupon.id,
			code: coupon.code,
			name: coupon.name,
			discountType: coupon.discountType,
			discountValue: parseFloat(coupon.discountValue),
			minOrderValue: coupon.minOrderValue,
			startDate: coupon.startDate,
			expiryDate: coupon.expiryDate,
			usageLimitGlobal: coupon.usageLimitGlobal,
			usageLimitPerUser: coupon.usageLimitPerUser,
			isGlobal: coupon.isGlobal,
			isActive: coupon.isActive,
			createdAt: coupon.createdAt,
			updatedAt: coupon.updatedAt,
		};
	}
}
