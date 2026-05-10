import {
  Injectable,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateSweetDto,
  UpdateSweetDto,
  GetSweetsQueryDto,
  SweetDataDto,
  GetAllSweetsDataDto,
  DeleteSweetResponseDto,
  CreateSweetRegionItemPriceDto,
  SortBy,
} from '../dto';
import { db } from '@/db';
import { sweets, tags, regionItemPrices, regions, offers } from '@/db/schema';
import { eq, desc, asc, and, sql, getTableColumns } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { BakeryItemStoreService } from '../../bakery/services/bakery-item-store.service';
import { TranslationService } from '@/common/translation/translation.service';
import { isOfferActive } from '@/db/utils/helpers';

type FlattenedSweet = Omit<typeof sweets.$inferSelect, 'name' | 'description'> & { 
  name: string; 
  description: string; 
};

type FlattenedOffer = Omit<typeof offers.$inferSelect, 'name'> & { 
  name: string; 
};

@Injectable()
export class SweetService {
  private readonly logger = new Logger(SweetService.name);

  constructor(
    private readonly bakeryItemStoreService: BakeryItemStoreService,
    private readonly translationService: TranslationService,
  ) {}

  /**
   * Validate that a tag exists by ID
   */
  private async validateTagExists(tagId: string): Promise<void> {
    const tagResult = await db
      .select({ id: tags.id })
      .from(tags)
      .where(eq(tags.id, tagId))
      .limit(1);

    if (tagResult.length === 0) {
      throw new BadRequestException(
        errorResponse(
          `routes.tags.not_found_with_id`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          { tagId },
        ),
      );
    }
  }

  async create(createDto: CreateSweetDto): Promise<SuccessResponse<SweetDataDto>> {
    try {
      // Validate tag exists if tagId is provided
      if (createDto.tagId) {
        await this.validateTagExists(createDto.tagId);
      }

      const nameObject = await this.translationService.getTranslationObject(createDto.name);
      const descriptionObject = await this.translationService.getTranslationObject(createDto.description);

      const [newSweet] = await db
        .insert(sweets)
        .values({
          name: nameObject,
          description: descriptionObject,
          images: createDto.images,
          sizes: createDto.sizes,
          tagId: createDto.tagId,
          isActive: createDto.isActive ?? true,
        })
        .returning({
          ...getTableColumns(sweets),
          name: this.translationService.getLocalized(sweets.name, 'name'),
          description: this.translationService.getLocalized(sweets.description, 'description'),
        });

      let tagName: string | undefined = undefined;
      
      if (newSweet.tagId) {
        const [tag] = await db
          .select({ 
            name: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(tags)
          .where(eq(tags.id, newSweet.tagId))
          .limit(1);
        tagName = tag?.name;
      }

      this.logger.log(`Sweet created: ${newSweet.id}`);
      return successResponse(
        this.mapToSweetResponse(newSweet, tagName),
        'routes.sweet.created',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.sweet.failed_create',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAll(query: GetSweetsQueryDto): Promise<SuccessResponse<GetAllSweetsDataDto>> {
    try {
      const offset = (query.page - 1) * query.limit;
      const sortOrder = query.order === 'desc' ? desc : asc;
      const sortColumn = query.sortBy === SortBy.NAME ? sweets.name : sweets.createdAt;

      let allSweetsResult: Array<{
        sweet: FlattenedSweet;
        tagName: string;
        price?: string;
        offer?: FlattenedOffer | null;
        sizesPrices?: Record<string, string> | null;
      }> = [];
      let total = 0;

      if (query.regionId) {
        const joinConditions = [
          eq(regionItemPrices.sweetId, sweets.id),
          eq(regionItemPrices.regionId, query.regionId),
        ] as const;

        const whereConditions: ReturnType<typeof eq | typeof sql>[] = [];
        if (query.tag) {
          whereConditions.push(eq(
            this.translationService.getLocalized(tags.name, null, 'en'),
            query.tag
          ));
        }
        if (query.search) {
          const searchPattern = `%${query.search}%`;
          whereConditions.push(sql`LOWER(${this.translationService.getLocalized(sweets.name, null, 'en')}) LIKE LOWER(${searchPattern})`);
        }

        const [{ count: regionCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${sweets.id})` })
          .from(sweets)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .leftJoin(tags, eq(sweets.tagId, tags.id))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        total = Number(regionCount);

        allSweetsResult = await db
          .select({
            sweet: {
              ...getTableColumns(sweets),
              name: this.translationService.getLocalized(sweets.name, 'name'),
              description: this.translationService.getLocalized(sweets.description, 'description'),
            },
            tagName: this.translationService.getLocalized(tags.name, 'name'),
            price: regionItemPrices.price,
            offer: {
              ...getTableColumns(offers),
              name: this.translationService.getLocalized(offers.name, 'name'),
            },
            sizesPrices: regionItemPrices.sizesPrices,
          })
          .from(sweets)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .leftJoin(tags, eq(sweets.tagId, tags.id))
          .leftJoin(offers, and(
            eq(regionItemPrices.offerId, offers.id),
            isOfferActive(offers),
          ))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      } else if (query.tag) {
        const whereConditions: ReturnType<typeof eq | typeof sql>[] = [eq(
          this.translationService.getLocalized(tags.name, null, 'en'),
          query.tag
        )];
        if (query.search) {
          const searchPattern = `%${query.search}%`;
          whereConditions.push(sql`LOWER(${this.translationService.getLocalized(sweets.name, null, 'en')}) LIKE LOWER(${searchPattern})`);
        }

        const [{ count: tagCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${sweets.id})` })
          .from(sweets)
          .innerJoin(tags, eq(sweets.tagId, tags.id))
          .where(and(...whereConditions));

        total = Number(tagCount);

        allSweetsResult = await db
          .select({
            sweet: {
              ...getTableColumns(sweets),
              name: this.translationService.getLocalized(sweets.name, 'name'),
              description: this.translationService.getLocalized(sweets.description, 'description'),
            },
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(sweets)
          .innerJoin(tags, eq(sweets.tagId, tags.id))
          .where(and(...whereConditions))
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      } else if (query.search) {
        const searchPattern = `%${query.search}%`;
        const [{ count: searchCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${sweets.id})` })
          .from(sweets)
          .where(sql`LOWER(${this.translationService.getLocalized(sweets.name, null, 'en')}) LIKE LOWER(${searchPattern})`);

        total = Number(searchCount);

        allSweetsResult = await db
          .select({
            sweet: {
              ...getTableColumns(sweets),
              name: this.translationService.getLocalized(sweets.name, 'name'),
              description: this.translationService.getLocalized(sweets.description, 'description'),
            },
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(sweets)
          .leftJoin(tags, eq(sweets.tagId, tags.id))
          .where(sql`LOWER(${this.translationService.getLocalized(sweets.name, null, 'en')}) LIKE LOWER(${searchPattern})`)
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      } else {
        const [{ count: untaggedCount }] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(sweets);

        total = Number(untaggedCount);

        allSweetsResult = await db
          .select({
            sweet: {
              ...getTableColumns(sweets),
              name: this.translationService.getLocalized(sweets.name, 'name'),
              description: this.translationService.getLocalized(sweets.description, 'description'),
            },
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(sweets)
          .leftJoin(tags, eq(sweets.tagId, tags.id))
          .orderBy(sortOrder(sortColumn))
          .limit(query.limit)
          .offset(offset);
      }

      const totalPages = Math.ceil(total / query.limit);

      return successResponse(
        {
          items: allSweetsResult.map((row) =>
            this.mapToSweetResponse(
              row.sweet, 
              row.tagName, 
              row.price, 
              row.offer,
              row.sizesPrices || undefined,
            ),
          ),
          pagination: {
            total,
            totalPages,
            page: query.page,
            limit: query.limit,
          },
        },
        'routes.sweet.list_retrieved',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve sweets: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.sweet.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findOne(id: string): Promise<SuccessResponse<SweetDataDto>> {
    try {
      const result = await db
        .select({
          sweet: {
            ...getTableColumns(sweets),
            name: this.translationService.getLocalized(sweets.name, 'name'),
            description: this.translationService.getLocalized(sweets.description, 'description'),
          },
          tag: {
            id: tags.id,
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          },
        })
        .from(sweets)
        .leftJoin(tags, eq(sweets.tagId, tags.id))
        .where(eq(sweets.id, id))
        .limit(1);

      const item = result[0];

      if (!item) {
        this.logger.warn(`Sweet not found: ${id}`);
        throw new NotFoundException(
          errorResponse('routes.sweet.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      return successResponse(
        this.mapToSweetResponse(item.sweet, item.tag?.tagName),
        'routes.sweet.retrieved',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve sweet ${id}: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.sweet.failed_retrieve',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async update(id: string, updateDto: UpdateSweetDto): Promise<SuccessResponse<SweetDataDto>> {
    
    try {

      const nameObject = await this.translationService.getTranslationObject(updateDto.name);
      const descriptionObject = await this.translationService.getTranslationObject(updateDto.description);

      const [updated] = await db
        .update(sweets)
        .set({
          name: nameObject,
          description: descriptionObject,
          images: updateDto.images,
          sizes: updateDto.sizes,
          tagId: updateDto.tagId,
          isActive: updateDto.isActive,
          updatedAt: new Date(),
        })
        .where(eq(sweets.id, id))
        .returning({
          ...getTableColumns(sweets),
          name: this.translationService.getLocalized(sweets.name, 'name'),
          description: this.translationService.getLocalized(sweets.description, 'description'),
        });

      if (!updated) {
        this.logger.warn(`Sweet not found for update: ${id}`);
        throw new NotFoundException(
          errorResponse('routes.sweet.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      let tagName: string | undefined = undefined;
      if (updated.tagId) {
        const [tag] = await db
          .select({ 
            name: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(tags)
          .where(eq(tags.id, updated.tagId))
          .limit(1);
        tagName = tag?.name;
      }

      this.logger.log(`Sweet updated: ${id}`);
      return successResponse(
        this.mapToSweetResponse(updated, tagName),
        'routes.sweet.updated',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet update error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.sweet.failed_update',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(id: string): Promise<SuccessResponse<DeleteSweetResponseDto>> {
    try {
      const [deleted] = await db.delete(sweets).where(eq(sweets.id, id)).returning();

      if (!deleted) {
        this.logger.warn(`Sweet not found for deletion: ${id}`);
        throw new NotFoundException(
          errorResponse('routes.sweet.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      this.logger.log(`Sweet deleted: ${id}`);
      return successResponse(
        { message: 'routes.sweet.deleted' },
        'routes.sweet.deleted',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet deletion error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.sweet.failed_delete',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async toggleStatus(id: string): Promise<SuccessResponse<SweetDataDto>> {
    try {
      const [existing] = await db.select().from(sweets).where(eq(sweets.id, id)).limit(1);

      if (!existing) {
        this.logger.warn(`Sweet not found for status toggle: ${id}`);
        throw new NotFoundException(
          errorResponse('routes.sweet.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const [updated] = await db
        .update(sweets)
        .set({
          isActive: !existing.isActive,
          updatedAt: new Date(),
        })
        .where(eq(sweets.id, id))
        .returning({
          ...getTableColumns(sweets),
          name: this.translationService.getLocalized(sweets.name, 'name'),
          description: this.translationService.getLocalized(sweets.description, 'description'),
        });

      let tagName: string | undefined = undefined;
      if (updated.tagId) {
        const [tag] = await db
          .select({ 
            name: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(tags)
          .where(eq(tags.id, updated.tagId))
          .limit(1);
        tagName = tag?.name;
      }

      this.logger.log(`Sweet status toggled: ${id}`);
      return successResponse(
        this.mapToSweetResponse(updated, tagName),
        'routes.sweet.status_toggled',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Sweet status toggle error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.sweet.failed_toggle_status',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Validate that a sweet exists by ID
   */
  private async validateSweetExists(sweetId: string): Promise<void> {
    const sweetResult = await db
      .select({ id: sweets.id })
      .from(sweets)
      .where(eq(sweets.id, sweetId))
      .limit(1);

    if (sweetResult.length === 0) {
      throw new BadRequestException(
        errorResponse(
          `routes.sweet.not_found_with_id`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          { sweetId },
        ),
      );
    }
  }

  /**
   * Validate that a region exists by ID
   */
  private async validateRegionExists(regionId: string): Promise<void> {
    const regionResult = await db
      .select({ id: regions.id })
      .from(regions)
      .where(eq(regions.id, regionId))
      .limit(1);

    if (regionResult.length === 0) {
      throw new BadRequestException(
        errorResponse(
          `routes.regions.not_found_with_id`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          { regionId },
        ),
      );
    }
  }

  async createRegionItemPrice(createSweetRegionItemPriceDto: CreateSweetRegionItemPriceDto) {
    const { sweetId, regionId, price, sizesPrices } = createSweetRegionItemPriceDto;

    try {
      // Validate both IDs exist
      await this.validateSweetExists(sweetId);
      await this.validateRegionExists(regionId);

      // Check if pricing already exists for this sweet and region
      const existingPrice = await db
        .select()
        .from(regionItemPrices)
        .where(and(eq(regionItemPrices.sweetId, sweetId), eq(regionItemPrices.regionId, regionId)))
        .limit(1);

      let regionItemPrice: typeof regionItemPrices.$inferSelect;
      if (existingPrice.length > 0) {
        const [updated] = await db
          .update(regionItemPrices)
          .set({
            price,
            sizesPrices: sizesPrices || null,
            updatedAt: new Date(),
          })
          .where(
            and(eq(regionItemPrices.sweetId, sweetId), eq(regionItemPrices.regionId, regionId)),
          )
          .returning();
        regionItemPrice = updated;
        this.logger.log(`Region pricing updated: sweet ${sweetId}, region ${regionId}`);
      } else {
        const [created] = await db
          .insert(regionItemPrices)
          .values({
            sweetId,
            regionId,
            price,
            sizesPrices: sizesPrices || null,
          })
          .returning();
        regionItemPrice = created;
        this.logger.log(`Region pricing created: sweet ${sweetId}, region ${regionId}`);

        // Create bakery item stores for all bakeries in this region
        await this.bakeryItemStoreService.createStoresForRegionItemPrice(
          regionItemPrice.id,
          regionId,
        );
      }

      return successResponse(
        {
          sweetId: regionItemPrice.sweetId,
          regionId: regionItemPrice.regionId,
          price: regionItemPrice.price,
          sizesPrices: regionItemPrice.sizesPrices || undefined,
          createdAt: regionItemPrice.createdAt,
          updatedAt: regionItemPrice.updatedAt,
        },
        'routes.sweet.region_pricing_created',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create region pricing: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.sweet.region_pricing_failed_create',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private mapToSweetResponse(
    sweet: FlattenedSweet,
    tagName?: string,
    price?: string,
    offer?: FlattenedOffer | null,
    sizesPrices?: Record<string, string>,
  ) {
    return {
      id: sweet.id,
      name: sweet.name,
      description: sweet.description,
      tagId: sweet.tagId || undefined,
      tagName: tagName,
      images: sweet.images,
      sizes: sweet.sizes,
      price: price || undefined,
      offer: offer ? {
        id: offer.id,
        name: offer.name,
        percentage: offer.percentage,
        expiryDate: offer.expiryDate,
      } : null,
      sizesPrices: sizesPrices || undefined,
      isActive: sweet.isActive,
      createdAt: sweet.createdAt,
      updatedAt: sweet.updatedAt,
    };
  }
}
