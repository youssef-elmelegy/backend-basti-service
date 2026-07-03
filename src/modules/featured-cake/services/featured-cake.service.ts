import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { db } from '@/db';
import { featuredCakes, tags, regionItemPrices, offers } from '@/db/schema';
import { eq, desc, sql, asc, and, getTableColumns } from 'drizzle-orm';
import {
  CreateFeaturedCakeDto,
  UpdateFeaturedCakeDto,
  GetFeaturedCakesQueryDto,
  CreateRegionItemPriceDto,
} from '../dto';
import {
  errorResponse,
  SuccessResponse,
  successResponse,
  validateCakeExists,
  buildSearchPattern,
} from '@/utils';
import { BakeryItemStoreService } from '../../bakery/services/bakery-item-store.service';
import { TranslationService } from '@/common';
import { getErrorMessage } from '@/utils';
import { validateTagExists, validateRegionExists } from '@/utils';
import { isOfferActive } from '@/db/utils/helpers';

type FlattenedFeaturedCake = Omit<typeof featuredCakes.$inferSelect, 'name' | 'description'> & {
  name: string;
  description: string;
};

type FlattenedOffer = Omit<typeof offers.$inferSelect, 'name'> & {
  name: string;
};

@Injectable()
export class FeaturedCakeService {
  private readonly logger = new Logger(FeaturedCakeService.name);

  constructor(
    private readonly bakeryItemStoreService: BakeryItemStoreService,
    private readonly translationService: TranslationService,
  ) {}

  async create(createFeaturedCakeDto: CreateFeaturedCakeDto) {
    const {
      name,
      description,
      images,
      capacity,
      flavorList = [],
      pipingPaletteList = [],
      tagId,
      isActive = true,
      minPrepHours = 0,
    } = createFeaturedCakeDto;

    try {
      if (tagId) {
        await validateTagExists(tagId);
      }

      const nameObject = await this.translationService.getTranslationObject(name);
      const descriptionObject = await this.translationService.getTranslationObject(description);

      const [newCake] = await db
        .insert(featuredCakes)
        .values({
          name: nameObject,
          description: descriptionObject,
          images,
          capacity,
          flavorList,
          pipingPaletteList,
          tagId,
          isActive,
          minPrepHours,
        })
        .returning({
          ...getTableColumns(featuredCakes),
          name: this.translationService.getLocalized(featuredCakes.name, 'name'),
          description: this.translationService.getLocalized(
            featuredCakes.description,
            'description',
          ),
        });

      this.logger.log(`Cake created: ${newCake.id} (${name})`);

      // Fetch tag name if tagId exists
      let tagName: string;
      if (newCake.tagId) {
        const tagResult = await db
          .select({
            name: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(tags)
          .where(eq(tags.id, newCake.tagId))
          .limit(1);
        tagName = tagResult[0]?.name || '';
      } else {
        tagName = '';
      }

      return successResponse(
        this.mapToCakeResponse(newCake, tagName),
        'routes.featured_cakes.created',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = getErrorMessage(error);
      this.logger.error(`Failed to create cake: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('routes.featured_cakes.failed_create', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async findAll(query: GetFeaturedCakesQueryDto) {
    const {
      page: queryPage = 1,
      limit: queryLimit = 10,
      tag,
      order,
      sort,
      regionId,
      search,
    } = query;

    const page = Number(queryPage) || 1;
    const limit = Number(queryLimit) || 10;

    try {
      const offset = (page - 1) * limit;
      const sortOrder = order === 'desc' ? desc : asc;
      const sortColumn = sort === 'alpha' ? featuredCakes.name : featuredCakes.createdAt;

      let allCakesResult: Array<{
        cake: FlattenedFeaturedCake;
        tagName: string | null;
        price?: string;
        offer?: FlattenedOffer | null;
      }> = [];
      let total = 0;

      if (regionId) {
        const joinConditions = [
          eq(regionItemPrices.featuredCakeId, featuredCakes.id),
          eq(regionItemPrices.regionId, regionId),
        ] as const;

        const whereConditions: ReturnType<typeof eq | typeof sql>[] = [];
        if (tag) {
          whereConditions.push(
            eq(this.translationService.getLocalized(tags.name, null, 'en'), tag),
          );
        }
        if (search) {
          const searchPattern = buildSearchPattern(search);
          whereConditions.push(
            sql`LOWER(${this.translationService.getLocalized(featuredCakes.name, null, 'en')}) LIKE LOWER(${searchPattern})`,
          );
        }

        const [{ count: regionCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${featuredCakes.id})` })
          .from(featuredCakes)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

        total = Number(regionCount);

        allCakesResult = await db
          .select({
            cake: {
              ...getTableColumns(featuredCakes),
              name: this.translationService.getLocalized(featuredCakes.name, 'name'),
              description: this.translationService.getLocalized(
                featuredCakes.description,
                'description',
              ),
            },
            tagName: this.translationService.getLocalized(tags.name, 'name'),
            price: regionItemPrices.price,
            offer: {
              ...getTableColumns(offers),
              name: this.translationService.getLocalized(offers.name, 'name'),
            },
          })
          .from(featuredCakes)
          .innerJoin(regionItemPrices, and(...joinConditions))
          .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
          .leftJoin(offers, and(eq(regionItemPrices.offerId, offers.id), isOfferActive(offers)))
          .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
          .orderBy(sortOrder(sortColumn))
          .limit(limit)
          .offset(offset);
      } else if (tag) {
        const whereConditions: ReturnType<typeof eq | typeof sql>[] = [
          eq(this.translationService.getLocalized(tags.name, null, 'en'), tag),
        ];
        if (search) {
          const searchPattern = buildSearchPattern(search);
          whereConditions.push(
            sql`LOWER(${this.translationService.getLocalized(featuredCakes.name, null, 'en')}) LIKE LOWER(${searchPattern})`,
          );
        }

        const [{ count: tagCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${featuredCakes.id})` })
          .from(featuredCakes)
          .innerJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(and(...whereConditions));

        total = Number(tagCount);

        allCakesResult = await db
          .select({
            cake: {
              ...getTableColumns(featuredCakes),
              name: this.translationService.getLocalized(featuredCakes.name, 'name'),
              description: this.translationService.getLocalized(
                featuredCakes.description,
                'description',
              ),
            },
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(featuredCakes)
          .innerJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(and(...whereConditions))
          .orderBy(sortOrder(sortColumn))
          .limit(limit)
          .offset(offset);
      } else if (search) {
        const searchPattern = buildSearchPattern(search);
        const [{ count: searchCount }] = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${featuredCakes.id})` })
          .from(featuredCakes)
          .where(
            sql`LOWER(${this.translationService.getLocalized(featuredCakes.name, null, 'en')}) LIKE LOWER(${searchPattern})`,
          );

        total = Number(searchCount);

        allCakesResult = await db
          .select({
            cake: {
              ...getTableColumns(featuredCakes),
              name: this.translationService.getLocalized(featuredCakes.name, 'name'),
              description: this.translationService.getLocalized(
                featuredCakes.description,
                'description',
              ),
            },
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(featuredCakes)
          .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
          .where(
            sql`LOWER(${this.translationService.getLocalized(featuredCakes.name, null, 'en')}) LIKE LOWER(${searchPattern})`,
          )
          .orderBy(sortOrder(sortColumn))
          .limit(limit)
          .offset(offset);
      } else {
        const [{ count: untaggedCount }] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(featuredCakes);

        total = Number(untaggedCount);

        allCakesResult = await db
          .select({
            cake: {
              ...getTableColumns(featuredCakes),
              name: this.translationService.getLocalized(featuredCakes.name, 'name'),
              description: this.translationService.getLocalized(
                featuredCakes.description,
                'description',
              ),
            },
            tagName: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(featuredCakes)
          .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
          .orderBy(sortOrder(sortColumn))
          .limit(limit)
          .offset(offset);
      }

      const totalPages = Math.ceil(total / limit);

      this.logger.debug(`Retrieved cakes: page ${page}, total ${total}`);

      return successResponse(
        {
          items: allCakesResult.map((item) =>
            this.mapToCakeResponse(item.cake, item.tagName, item.price, item.offer),
          ),
          total,
          page,
          limit,
          totalPages,
        },
        'routes.featured_cakes.list_retrieved',
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve cakes: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('routes.featured_cakes.failed_retrieve', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async findOne(id: string) {
    try {
      const cakeResult = await db
        .select({
          cake: {
            ...getTableColumns(featuredCakes),
            name: this.translationService.getLocalized(featuredCakes.name, 'name'),
            description: this.translationService.getLocalized(
              featuredCakes.description,
              'description',
            ),
          },
          tagName: this.translationService.getLocalized(tags.name, 'name'),
        })
        .from(featuredCakes)
        .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
        .where(eq(featuredCakes.id, id))
        .limit(1);

      if (!cakeResult.length) {
        this.logger.warn(`Cake not found: ${id}`);
        throw new NotFoundException(
          errorResponse('routes.featured_cakes.not_found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const { cake, tagName } = cakeResult[0];

      this.logger.debug(`Retrieved cake: ${id}`);
      return successResponse(
        this.mapToCakeResponse(cake, tagName || ''),
        'routes.featured_cakes.retrieved',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to retrieve cake: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('routes.featured_cakes.failed_retrieve', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async update(id: string, updateFeaturedCakeDto: UpdateFeaturedCakeDto) {
    try {
      // Check if cake exists
      const [existingCake] = await db
        .select()
        .from(featuredCakes)
        .where(eq(featuredCakes.id, id))
        .limit(1);

      if (!existingCake) {
        this.logger.warn(`Cake not found for update: ${id}`);
        throw new NotFoundException(
          errorResponse('routes.featured_cakes.not_found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      if (updateFeaturedCakeDto.tagId) {
        await validateTagExists(updateFeaturedCakeDto.tagId);
      }

      const updateData: Record<string, unknown> = Object.fromEntries(
        Object.entries(updateFeaturedCakeDto).filter(([, value]) => value !== undefined),
      );

      updateData.updatedAt = new Date();

      if (updateData.name !== undefined) {
        updateData.name = await this.translationService.getTranslationObject(updateData.name);
      }
      if (updateData.description !== undefined) {
        updateData.description = await this.translationService.getTranslationObject(
          updateData.description,
        );
      }

      const [updatedCake] = await db
        .update(featuredCakes)
        .set(updateData)
        .where(eq(featuredCakes.id, id))
        .returning({
          ...getTableColumns(featuredCakes),
          name: this.translationService.getLocalized(featuredCakes.name, 'name'),
          description: this.translationService.getLocalized(
            featuredCakes.description,
            'description',
          ),
        });

      this.logger.log(`Cake updated: ${id}`);

      // Fetch tag name if tagId exists
      let tagName: string;
      if (updatedCake.tagId) {
        const tagResult = await db
          .select({
            name: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(tags)
          .where(eq(tags.id, updatedCake.tagId))
          .limit(1);
        tagName = tagResult[0]?.name || '';
      } else {
        tagName = '';
      }

      return successResponse(
        this.mapToCakeResponse(updatedCake, tagName),
        'routes.featured_cakes.updated',
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = getErrorMessage(error);
      this.logger.error(`Failed to update cake: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('routes.featured_cakes.failed_update', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async remove(id: string) {
    try {
      const [cake] = await db.select().from(featuredCakes).where(eq(featuredCakes.id, id)).limit(1);

      if (!cake) {
        this.logger.warn(`Cake not found for deletion: ${id}`);
        throw new NotFoundException(
          errorResponse('routes.featured_cakes.not_found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      await db.delete(featuredCakes).where(eq(featuredCakes.id, id));

      this.logger.log(`Cake deleted: ${id}`);

      return successResponse(
        { message: 'routes.featured_cakes.deleted' },
        'routes.featured_cakes.deleted',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to delete cake: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse('routes.featured_cakes.failed_delete', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async toggleStatus(id: string) {
    try {
      const [existingCake] = await db
        .select()
        .from(featuredCakes)
        .where(eq(featuredCakes.id, id))
        .limit(1);

      if (!existingCake) {
        this.logger.warn(`Cake not found for status toggle: ${id}`);
        throw new NotFoundException(
          errorResponse('routes.featured_cakes.not_found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const [updatedCake] = await db
        .update(featuredCakes)
        .set({
          isActive: !existingCake.isActive,
          updatedAt: new Date(),
        })
        .where(eq(featuredCakes.id, id))
        .returning({
          ...getTableColumns(featuredCakes),
          name: this.translationService.getLocalized(featuredCakes.name, 'name'),
          description: this.translationService.getLocalized(
            featuredCakes.description,
            'description',
          ),
        });

      const statusText = updatedCake.isActive ? 'activated' : 'deactivated';
      this.logger.log(`Cake status toggled (${statusText}): ${id}`);

      let tagName: string;
      if (updatedCake.tagId) {
        const tagResult = await db
          .select({
            name: this.translationService.getLocalized(tags.name, 'name'),
          })
          .from(tags)
          .where(eq(tags.id, updatedCake.tagId))
          .limit(1);
        tagName = tagResult[0]?.name || '';
      } else {
        tagName = '';
      }

      return successResponse(
        this.mapToCakeResponse(updatedCake, tagName),
        'routes.featured_cakes.status_toggled',
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to toggle cake status: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.featured_cakes.failed_toggle_status',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    }
  }

  async toggleFeatured(id: string): Promise<SuccessResponse<{ message: string }>> {
    try {
      const [existing] = await db
        .select({
          id: featuredCakes.id,
          isFeatured: featuredCakes.isFeatured,
        })
        .from(featuredCakes)
        .where(eq(featuredCakes.id, id))
        .limit(1);

      if (!existing) {
        throw new NotFoundException(
          errorResponse(
            'routes.featured_cakes.not_found',
            HttpStatus.NOT_FOUND,
            'NotFoundException',
          ),
        );
      }

      await db
        .update(featuredCakes)
        .set({
          isFeatured: !existing.isFeatured,
          updatedAt: new Date(),
        })
        .where(eq(featuredCakes.id, id));

      return successResponse(
        { message: 'routes.item_flags.featured_toggled' },
        'routes.item_flags.featured_toggled',
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        errorResponse('routes.item_flags.failed_toggle_featured', HttpStatus.INTERNAL_SERVER_ERROR),
      );
    }
  }

  async createRegionItemPrice(createRegionItemPriceDto: CreateRegionItemPriceDto) {
    const { featuredCakeId, regionId, price } = createRegionItemPriceDto;

    try {
      // Validate both IDs exist
      await validateCakeExists(featuredCakeId);
      await validateRegionExists(regionId);

      // Check if pricing already exists for this cake and region
      const existingPrice = await db
        .select()
        .from(regionItemPrices)
        .where(
          and(
            eq(regionItemPrices.featuredCakeId, featuredCakeId),
            eq(regionItemPrices.regionId, regionId),
          ),
        )
        .limit(1);

      let regionItemPrice: typeof regionItemPrices.$inferSelect;
      if (existingPrice.length > 0) {
        const [updated] = await db
          .update(regionItemPrices)
          .set({
            price,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(regionItemPrices.featuredCakeId, featuredCakeId),
              eq(regionItemPrices.regionId, regionId),
            ),
          )
          .returning();
        regionItemPrice = updated;
        this.logger.log(`Region pricing updated: cake ${featuredCakeId}, region ${regionId}`);
      } else {
        const [created] = await db
          .insert(regionItemPrices)
          .values({
            featuredCakeId,
            regionId,
            price,
          })
          .returning();
        regionItemPrice = created;
        this.logger.log(`Region pricing created: cake ${featuredCakeId}, region ${regionId}`);

        // Create bakery item stores for all bakeries in this region
        await this.bakeryItemStoreService.createStoresForRegionItemPrice(
          regionItemPrice.id,
          regionId,
        );
      }

      return successResponse(
        {
          featuredCakeId: regionItemPrice.featuredCakeId,
          regionId: regionItemPrice.regionId,
          price: regionItemPrice.price,
          createdAt: regionItemPrice.createdAt,
          updatedAt: regionItemPrice.updatedAt,
        },
        'routes.featured_cakes.region_pricing_created',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const errorMsg = getErrorMessage(error);
      this.logger.error(`Failed to create region pricing: ${errorMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.featured_cakes.region_pricing_failed_create',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    }
  }

  private mapToCakeResponse(
    cake: FlattenedFeaturedCake,
    tagName?: string | null,
    price?: string,
    offer?: FlattenedOffer | null,
  ) {
    const response: Record<string, unknown> = {
      id: cake.id,
      name: cake.name,
      description: cake.description,
      images: cake.images,
      flavorList: cake.flavorList,
      pipingPaletteList: cake.pipingPaletteList,
      tagId: cake.tagId,
      tagName: tagName || null,
      capacity: cake.capacity,
      isActive: cake.isActive,
      isFeatured: cake.isFeatured,
      minPrepHours: cake.minPrepHours,
      offer: offer
        ? {
            id: offer.id,
            name: offer.name,
            percentage: offer.percentage,
            expiryDate: offer.expiryDate,
          }
        : null,
      createdAt: cake.createdAt,
      updatedAt: cake.updatedAt,
    };

    if (price !== undefined) {
      response.price = price;
    }

    return response;
  }
}
