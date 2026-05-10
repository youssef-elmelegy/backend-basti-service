import { TranslationService } from '@/common';
import { Injectable, Logger, NotFoundException, BadRequestException, InternalServerErrorException, HttpStatus } from '@nestjs/common';
import { db } from '@/db';
import { offers, regionItemPrices, regions } from '@/db/schema';
import { eq, and, desc, getTableColumns } from 'drizzle-orm';
import { errorResponse, SuccessResponse, successResponse } from '@/utils';
import { handleErrors } from '@/utils/errors.util';
import { OfferResponse, UpdateOfferDto, CreateOfferDto, ToggleItemOfferDto } from '@/modules/offer/dto/index';

type FlattenedOffer = Omit<typeof offers.$inferSelect, 'name'> & {
	name: string; 
};

@Injectable()
export class OfferService {
	private readonly logger = new Logger(OfferService.name);

	constructor(private readonly translationService: TranslationService) {}

	async create(
		data: CreateOfferDto,
	): Promise<SuccessResponse<OfferResponse>> {
		try {
			const nameObject = await this.translationService.getTranslationObject(data.name);

			const [offer] = await db.insert(offers).values({
				name: nameObject,
				percentage: data.percentage,
				startDate: data.startDate ? new Date(data.startDate) : null,
				expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
				isActive: data.isActive ?? true,
				createdAt: new Date(),
				updatedAt: new Date(),
			}).returning({
				...getTableColumns(offers),
				name: this.translationService.getLocalized(offers.name, 'name'),
			});

			return successResponse(
				this.formatOfferResponse(offer),
				'routes.offers.created',
				HttpStatus.CREATED,
			);
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Offer creation error: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.offers.failed_create',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async getAll(): Promise<SuccessResponse<OfferResponse[]>> {
		try {
			const result = await db
				.select({
					...getTableColumns(offers),
					name: this.translationService.getLocalized(offers.name, 'name'),
				})
				.from(offers)
				.orderBy(desc(offers.createdAt));
			return successResponse(
				result.map((coupon) => this.formatOfferResponse(coupon)),
				'routes.offers.list_retrieved',
		);
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Offers retrieval error: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.offers.failed_retrieve',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async getOne(id: string): Promise<SuccessResponse<OfferResponse>> {
		try {
			const [coupon] = await db
				.select({
					...getTableColumns(offers),
					name: this.translationService.getLocalized(offers.name, 'name'),
				})
				.from(offers)
				.where(eq(offers.id, id))
				.limit(1);

			if (!coupon) throw new NotFoundException('routes.offers.not_found');

			return successResponse(this.formatOfferResponse(coupon), 'routes.offers.retrieved');
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Failed to retrieve coupon: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.offers.failed_retrieve',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async update(id: string, data: UpdateOfferDto): Promise<SuccessResponse<OfferResponse>> {
		try {
			const [offer] = await db
				.select()
				.from(offers)
				.where(eq(offers.id, id))
				.limit(1);
			
			if (!offer) throw new NotFoundException('routes.offers.not_found');

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
				.update(offers)
				.set({
				...updateData,
			})
			.where(eq(offers.id, id))
			.returning({
				...getTableColumns(offers),
				name: this.translationService.getLocalized(offers.name, 'name'),
			});

			return successResponse(
				this.formatOfferResponse(updatedCoupon),
				'routes.offers.updated',
				HttpStatus.OK,
			);
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Offer update error: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.offers.failed_update',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async toggleStatus(id: string): Promise<SuccessResponse<OfferResponse>> {
		try {
			const [offer] = await db
				.select()
				.from(offers)
				.where(eq(offers.id, id))
				.limit(1);

			if (!offer) throw new NotFoundException('routes.offers.not_found');

			const [updatedOffer] = await db.update(offers)
				.set({
					isActive: !offer.isActive,
					updatedAt: new Date()
				})
				.where(eq(offers.id, id))
				.returning({
					...getTableColumns(offers),
					name: this.translationService.getLocalized(offers.name, 'name'),
				});

			return successResponse(
				this.formatOfferResponse(updatedOffer),
				'routes.offers.toggled',
				HttpStatus.OK,
			);
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Coupon status toggle error: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.offers.failed_toggle',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async delete(id: string): Promise<SuccessResponse<{ message: string }>> {
		try {
			const [offer] = await db
			.select({
				id: offers.id,
			})
			.from(offers)
			.where(eq(offers.id, id))
			.limit(1);

			if (!offer) throw new NotFoundException('routes.offers.not_found');
	
			await db.delete(offers).where(eq(offers.id, id));

			return successResponse(
				{
					message: 'routes.offers.deleted',
				},
				'routes.offers.deleted'
			);
		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Failed to delete offer: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					'routes.offers.failed_delete',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	async toggleItemOffer(data: ToggleItemOfferDto): Promise<SuccessResponse<{ message: string }>> {

		const {
			offerId,
			addonId,
			sweetId,
			featuredCakeId,
			predesignedCakeId,
			decorationId,
			shapeId,
			flavorId,
			regionId,
		} = data;

		try {

			const [region] = await db
				.select({ id: regions.id })
				.from(regions)
				.where(eq(regions.id, regionId))
				.limit(1);

			if (!region) {
				throw new BadRequestException(
					errorResponse(
						'routes.regions.not_found',
						HttpStatus.BAD_REQUEST,
						'BadRequest',
					),
				);
			}

			let sale: number | null = null;

			if (offerId) {
				const [offer] = await db
					.select({ percentage: offers.percentage })
					.from(offers)
					.where(eq(offers.id, offerId))
					.limit(1);

				if (!offer) {
					throw new BadRequestException(
						errorResponse(
							'routes.offers.not_found',
							HttpStatus.BAD_REQUEST,
							'BadRequest',
						),
					);
				}
				
				sale = offer.percentage;
			}

			if (addonId) {
				const [addonPricing] = await db
					.select({ id: regionItemPrices.id })
					.from(regionItemPrices)
					.where(and(
						eq(regionItemPrices.regionId, regionId),
						eq(regionItemPrices.addonId, addonId),
					))	
					.limit(1);

				if (!addonPricing) {
					throw new BadRequestException(
						errorResponse(
							'routes.offers.item_region_error',
							HttpStatus.BAD_REQUEST,
							'BadRequest',
						),
					);
				}
					
				await db
					.update(regionItemPrices)
					.set({
						offerId: data.offerId || null,
					})
					.where(eq(regionItemPrices.id, addonPricing.id))
			}
			else if (featuredCakeId) {
				const [featuredCakePricing] = await db
					.select({ id: regionItemPrices.id })
					.from(regionItemPrices)
					.where(and(
						eq(regionItemPrices.regionId, regionId),
						eq(regionItemPrices.featuredCakeId, featuredCakeId),
					))	
					.limit(1);

				if (!featuredCakePricing) {
					throw new BadRequestException(
						errorResponse(
							'routes.offers.item_region_error',
							HttpStatus.BAD_REQUEST,
							'BadRequest',
						),
					);
				}
					
				await db
					.update(regionItemPrices)
					.set({
						offerId: data.offerId || null,
					})
					.where(eq(regionItemPrices.id, featuredCakePricing.id))

			}
			else if (sweetId) {
				const [sweetPricing] = await db
					.select({ id: regionItemPrices.id })
					.from(regionItemPrices)
					.where(and(
						eq(regionItemPrices.regionId, regionId),
						eq(regionItemPrices.sweetId, sweetId),
					))	
					.limit(1);

				if (!sweetPricing) {
					throw new BadRequestException(
						errorResponse(
							'routes.offers.item_region_error',
							HttpStatus.BAD_REQUEST,
							'BadRequest',
						),
					);
				}
					
				await db
					.update(regionItemPrices)
					.set({
						offerId: data.offerId || null,
					})
					.where(eq(regionItemPrices.id, sweetPricing.id))
			}
			else if (predesignedCakeId) {
				const [predesignedCakePricing] = await db
					.select({ id: regionItemPrices.id })
					.from(regionItemPrices)
					.where(and(
						eq(regionItemPrices.regionId, regionId),
						eq(regionItemPrices.predesignedCakeId, predesignedCakeId),
					))	
					.limit(1);

				if (!predesignedCakePricing) {
					throw new BadRequestException(
						errorResponse(
							'routes.offers.item_region_error',
							HttpStatus.BAD_REQUEST,
							'BadRequest',
						),
					);
				}
					
				await db
					.update(regionItemPrices)
					.set({
						offerId: data.offerId || null,
					})
					.where(eq(regionItemPrices.id, predesignedCakePricing.id))
			}
			else if (decorationId) {
				const [decorationPricing] = await db
					.select({ id: regionItemPrices.id })
					.from(regionItemPrices)
					.where(and(
						eq(regionItemPrices.regionId, regionId),
						eq(regionItemPrices.decorationId, decorationId),
					))	
					.limit(1);

				if (!decorationPricing) {
					throw new BadRequestException(
						errorResponse(
							'routes.offers.item_region_error',
							HttpStatus.BAD_REQUEST,
							'BadRequest',
						),
					);
				}
					
				await db
					.update(regionItemPrices)
					.set({
						offerId: data.offerId || null,
					})
					.where(eq(regionItemPrices.id, decorationPricing.id))
			}
			else if (shapeId) {
				const [shapePricing] = await db
					.select({ id: regionItemPrices.id })
					.from(regionItemPrices)
					.where(and(
						eq(regionItemPrices.regionId, regionId),
						eq(regionItemPrices.shapeId, shapeId),
					))	
					.limit(1);

				if (!shapePricing) {
					throw new BadRequestException(
						errorResponse(
							'routes.offers.item_region_error',
							HttpStatus.BAD_REQUEST,
							'BadRequest',
						),
					);
				}
					
				await db
					.update(regionItemPrices)
					.set({
						offerId: data.offerId || null,
					})
					.where(eq(regionItemPrices.id, shapePricing.id))
			}
			else if (flavorId) {
				const [flavorPricing] = await db
					.select({ id: regionItemPrices.id })
					.from(regionItemPrices)
					.where(and(
						eq(regionItemPrices.regionId, regionId),
						eq(regionItemPrices.flavorId, flavorId),
					))	
					.limit(1);

				if (!flavorPricing) {
					throw new BadRequestException(
						errorResponse(
							'routes.offers.item_region_error',
							HttpStatus.BAD_REQUEST,
							'BadRequest',
						),
					);
				}
					
				await db
					.update(regionItemPrices)
					.set({
						offerId: data.offerId || null,
					})
					.where(eq(regionItemPrices.id, flavorPricing.id))
			}
			else {
				throw new BadRequestException(
					errorResponse(
						'routes.offers.no_item',
						HttpStatus.BAD_REQUEST,
						'BadRequest',
					),
				);
			}

			return successResponse(
				{
					message: offerId ? 'routes.offers.added_item' : 'routes.offers.removed_item',
				},
				offerId ? 'routes.offers.added_item' : 'routes.offers.removed_item'
			);

		} catch (error) {
			const errMsg = handleErrors(error);
			this.logger.error(`Failed to add item to offer: ${errMsg}`);
			throw new InternalServerErrorException(
				errorResponse(
					offerId ? 'routes.offers.failed_add_item' : 'routes.offers.failed_remove_item',
					HttpStatus.INTERNAL_SERVER_ERROR,
					'InternalServerError',
				),
			);
		}
	}

	private formatOfferResponse(offer: FlattenedOffer): OfferResponse {
		return {
			id: offer.id,
			name: offer.name,
			percentage: offer.percentage,
			startDate: offer.startDate,
			expiryDate: offer.expiryDate,
			isActive: offer.isActive,
			createdAt: offer.createdAt,
			updatedAt: offer.updatedAt,
		};
	}
}
