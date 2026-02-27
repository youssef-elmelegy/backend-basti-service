import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import {
  cartItems,
  tags,
  sweets,
  addons,
  featuredCakes,
  predesignedCakes,
  regionItemPrices,
  addonOptions,
  designedCakeConfigs,
  flavors,
  decorations,
  shapes,
} from '@/db/schema';
import { eq, and, inArray, getTableColumns } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import {
  CartResponseDto,
  CreateAddonItemDto,
  CreateSweetItemDto,
  CreateFeaturedCakeItemDto,
  CreatePredesignedCakeItemDto,
  CreateCustomCakeItemDto,
  UpdateQuantityDto,
  BulkDeleteDto,
  DeleteOneDto,
  ToggleStatusDto,
  CustomCakeConfigDto,
} from '../dto';
import { errorResponse } from '@/utils';
import { AddonService } from '@/modules/addon/services/addon.service';
import { SweetService } from '@/modules/sweet/services/sweet.service';
import { FeaturedCakeService } from '@/modules/featured-cake/services/featured-cake.service';
import { PredesignedCakesService } from '@/modules/custom-cakes/services/predesigned-cakes.service';
import { DecorationService } from '@/modules/custom-cakes/services/decoration.service';
import { FlavorService } from '@/modules/custom-cakes/services/flavor.service';
import { ShapeService } from '@/modules/custom-cakes/services/shape.service';
import { RegionService } from '@/modules/region/services/region.service';

@Injectable()
export class CartService {
  constructor(
    private readonly addonService: AddonService,
    private readonly sweetService: SweetService,
    private readonly featuredCakeService: FeaturedCakeService,
    private readonly predesignedCakesService: PredesignedCakesService,
    private readonly regionService: RegionService,
    private readonly decorationService: DecorationService,
    private readonly flavorService: FlavorService,
    private readonly shapeService: ShapeService,
  ) {}

  private readonly logger = new Logger(CartService.name);

  async getAll(userId: string, regionId: string): Promise<CartResponseDto> {
    const bigCart = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.type, 'big_cakes')));

    const smallCart = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.type, 'small_cakes')));

    const othersCart = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.type, 'others')));

    const bigCartExpanded: CartResponseDto['bigCakes'] = {
      customCakes: [],
      predesignedCake: [],
      featuredCakes: [],
      addons: [],
    };

    const smallCartExpanded: CartResponseDto['smallCakes'] = {
      customCakes: [],
      predesignedCake: [],
      featuredCakes: [],
      addons: [],
    };

    const othersCartExpanded: CartResponseDto['others'] = {
      sweets: [],
      addons: [],
    };

    for (const item of bigCart) {
      if (item.addonId) {
        const addon = await this.getAddon(item.addonId, regionId);
        const unitPrice =
          Number(addon.price) + (addon.addonOption ? Number(addon.addonOption.value) : 0);
        bigCartExpanded.addons.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: addon,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.featuredCakeId) {
        const featuredCake = await this.getFeaturedCake(item.featuredCakeId, regionId);
        const unitPrice = Number(featuredCake.price);
        bigCartExpanded.featuredCakes.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: {
            ...featuredCake,
            updatedAt: featuredCake.updatedAt.toISOString(),
            createdAt: featuredCake.createdAt.toISOString(),
          },
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.predesignedCakeId) {
        const predesignedCake = await this.getPredesignedCake(item.predesignedCakeId, regionId);
        const unitPrice = predesignedCake.configs.reduce((total, config) => {
          return (
            total +
            Number(config.flavor.price) +
            Number(config.decoration.price) +
            Number(config.shape.price)
          );
        }, 0);
        bigCartExpanded.predesignedCake.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: predesignedCake,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.customCake) {
        const customCakeData = await this.getCustomCakeComponents(item.customCake, regionId);
        const unitPrice =
          Number(customCakeData.decoration.price) +
          Number(customCakeData.flavor.price) +
          Number(customCakeData.shape.price) +
          customCakeData.extraLayers.reduce(
            (total, layer) => total + Number(layer.flavor.price),
            0,
          );
        bigCartExpanded.customCakes.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: customCakeData,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      }
    }

    for (const item of smallCart) {
      if (item.addonId) {
        const addon = await this.getAddon(item.addonId, regionId);
        const unitPrice =
          Number(addon.price) + (addon.addonOption ? Number(addon.addonOption.value) : 0);
        smallCartExpanded.addons.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: addon,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.featuredCakeId) {
        const featuredCake = await this.getFeaturedCake(item.featuredCakeId, regionId);
        const unitPrice = Number(featuredCake.price);
        bigCartExpanded.featuredCakes.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: {
            ...featuredCake,
            updatedAt: featuredCake.updatedAt.toISOString(),
            createdAt: featuredCake.createdAt.toISOString(),
          },
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.predesignedCakeId) {
        const predesignedCake = await this.getPredesignedCake(item.predesignedCakeId, regionId);
        const unitPrice = predesignedCake.configs.reduce((total, config) => {
          return (
            total +
            Number(config.flavor.price) +
            Number(config.decoration.price) +
            Number(config.shape.price)
          );
        }, 0);
        smallCartExpanded.predesignedCake.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: predesignedCake,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.customCake) {
        const customCakeData = await this.getCustomCakeComponents(item.customCake, regionId);
        const unitPrice =
          Number(customCakeData.decoration.price) +
          Number(customCakeData.flavor.price) +
          Number(customCakeData.shape.price) +
          customCakeData.extraLayers.reduce(
            (total, layer) => total + Number(layer.flavor.price),
            0,
          );
        smallCartExpanded.customCakes.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: customCakeData,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      }
    }

    for (const item of othersCart) {
      if (item.addonId) {
        const addon = await this.getAddon(item.addonId, regionId);
        const unitPrice =
          Number(addon.price) + (addon.addonOption ? Number(addon.addonOption.value) : 0);
        othersCartExpanded.addons.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: addon,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.sweetId) {
        const sweet = await this.getSweet(item.sweetId, regionId);
        const unitPrice = Number(sweet.price);
        othersCartExpanded.sweets.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: sweet,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      }
    }

    return {
      bigCakes: bigCartExpanded,
      smallCakes: smallCartExpanded,
      others: othersCartExpanded,
    };
  }

  private async getAddon(addonId: string, regionId: string) {
    const [addon] = await db
      .select({
        ...getTableColumns(addons),
        tagName: tags.name,
        price: regionItemPrices.price,
        addonOption: getTableColumns(addonOptions),
      })
      .from(addons)
      .leftJoin(tags, eq(addons.tagId, tags.id))
      .leftJoin(
        regionItemPrices,
        and(eq(regionItemPrices.addonId, addons.id), eq(regionItemPrices.regionId, regionId)),
      )
      .leftJoin(addonOptions, eq(addonOptions.addonId, addons.id))
      .where(eq(addons.id, addonId))
      .limit(1);

    return addon;
  }

  private async getSweet(sweetId: string, regionId: string) {
    const [sweet] = await db
      .select({
        ...getTableColumns(sweets),
        tagName: tags.name,
        price: regionItemPrices.price,
      })
      .from(sweets)
      .leftJoin(tags, eq(sweets.tagId, tags.id))
      .leftJoin(
        regionItemPrices,
        and(eq(regionItemPrices.sweetId, sweets.id), eq(regionItemPrices.regionId, regionId)),
      )
      .where(eq(sweets.id, sweetId))
      .limit(1);

    return sweet;
  }

  private async getFeaturedCake(featuredCakeId: string, regionId: string) {
    const [featuredCake] = await db
      .select({
        ...getTableColumns(featuredCakes),
        tagName: tags.name,
        price: regionItemPrices.price,
      })
      .from(featuredCakes)
      .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
      .leftJoin(
        regionItemPrices,
        and(
          eq(regionItemPrices.featuredCakeId, featuredCakes.id),
          eq(regionItemPrices.regionId, regionId),
        ),
      )
      .where(eq(featuredCakes.id, featuredCakeId))
      .limit(1);

    return featuredCake;
  }

  private async getPredesignedCake(predesignedCakeId: string, regionId: string) {
    const flavorPrices = alias(regionItemPrices, 'flavorPrices');
    const decorationPrices = alias(regionItemPrices, 'decorationPrices');
    const shapePrices = alias(regionItemPrices, 'shapePrices');

    const configs = await db
      .select({
        id: designedCakeConfigs.id,
        flavorId: designedCakeConfigs.flavorId,
        decorationId: designedCakeConfigs.decorationId,
        shapeId: designedCakeConfigs.shapeId,
        frostColorValue: designedCakeConfigs.frostColorValue,
        createdAt: designedCakeConfigs.createdAt,
        updatedAt: designedCakeConfigs.updatedAt,
        flavor: {
          id: flavors.id,
          title: flavors.title,
          description: flavors.description,
          flavorUrl: flavors.flavorUrl,
          price: flavorPrices.price,
          createdAt: flavors.createdAt,
          updatedAt: flavors.updatedAt,
        },
        decoration: {
          id: decorations.id,
          title: decorations.title,
          description: decorations.description,
          decorationUrl: decorations.decorationUrl,
          tagId: decorations.tagId,
          price: decorationPrices.price,
          createdAt: decorations.createdAt,
          updatedAt: decorations.updatedAt,
        },
        shape: {
          id: shapes.id,
          title: shapes.title,
          description: shapes.description,
          shapeUrl: shapes.shapeUrl,
          price: shapePrices.price,
          createdAt: shapes.createdAt,
          updatedAt: shapes.updatedAt,
        },
      })
      .from(designedCakeConfigs)
      .innerJoin(flavors, eq(designedCakeConfigs.flavorId, flavors.id))
      .innerJoin(decorations, eq(designedCakeConfigs.decorationId, decorations.id))
      .innerJoin(shapes, eq(designedCakeConfigs.shapeId, shapes.id))
      .leftJoin(
        flavorPrices,
        and(eq(flavorPrices.flavorId, flavors.id), eq(flavorPrices.regionId, regionId)),
      )
      .leftJoin(
        decorationPrices,
        and(
          eq(decorationPrices.decorationId, decorations.id),
          eq(decorationPrices.regionId, regionId),
        ),
      )
      .leftJoin(
        shapePrices,
        and(eq(shapePrices.shapeId, shapes.id), eq(shapePrices.regionId, regionId)),
      )
      .where(eq(designedCakeConfigs.predesignedCakeId, predesignedCakeId));

    const [predesignedCake] = await db
      .select({
        ...getTableColumns(predesignedCakes),
        tagName: tags.name,
      })
      .from(predesignedCakes)
      .leftJoin(tags, eq(predesignedCakes.tagId, tags.id))
      .where(eq(predesignedCakes.id, predesignedCakeId))
      .limit(1);

    return {
      ...predesignedCake,
      configs: configs.map((config) => ({
        id: config.id,
        flavor: config.flavor,
        decoration: config.decoration,
        shape: config.shape,
        frostColorValue: config.frostColorValue,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      })),
    };
  }

  private async getCustomCakeComponents(customCake: CustomCakeConfigDto, regionId: string) {
    const [decoration] = await db
      .select({
        ...getTableColumns(decorations),
        price: regionItemPrices.price,
        tagName: tags.name,
      })
      .from(decorations)
      .leftJoin(tags, eq(decorations.tagId, tags.id))
      .leftJoin(
        regionItemPrices,
        and(
          eq(regionItemPrices.decorationId, decorations.id),
          eq(regionItemPrices.regionId, regionId),
        ),
      )
      .where(eq(decorations.id, customCake.decorationId))
      .limit(1);

    const [flavor] = await db
      .select({
        ...getTableColumns(flavors),
        price: regionItemPrices.price,
      })
      .from(flavors)
      .leftJoin(
        regionItemPrices,
        and(eq(regionItemPrices.flavorId, flavors.id), eq(regionItemPrices.regionId, regionId)),
      )
      .where(eq(flavors.id, customCake.flavorId))
      .limit(1);

    const [shape] = await db
      .select({
        ...getTableColumns(shapes),
        price: regionItemPrices.price,
      })
      .from(shapes)
      .leftJoin(
        regionItemPrices,
        and(eq(regionItemPrices.shapeId, shapes.id), eq(regionItemPrices.regionId, regionId)),
      )
      .where(eq(shapes.id, customCake.shapeId))
      .limit(1);

    type ExtraLayerExpandedType = {
      layer: number;
      flavor: {
        price: string;
        id: string;
        title: string;
        description: string;
        flavorUrl: string;
        createdAt: Date;
        updatedAt: Date;
      };
    };

    const extraLayersExpanded: ExtraLayerExpandedType[] = [];

    if (customCake.extraLayers.length > 0) {
      for (const layer of customCake.extraLayers) {
        const [flavorLayers] = await db
          .select({
            ...getTableColumns(flavors),
            price: regionItemPrices.price,
          })
          .from(flavors)
          .leftJoin(
            regionItemPrices,
            and(eq(regionItemPrices.flavorId, flavors.id), eq(regionItemPrices.regionId, regionId)),
          )
          .where(eq(flavors.id, layer.flavorId))
          .limit(1);
        extraLayersExpanded.push({
          layer: layer.layer,
          flavor: flavorLayers,
        });
      }
    }

    return {
      decoration,
      flavor,
      shape,
      extraLayers: extraLayersExpanded,
      message: customCake.message,
      color: customCake.color,
      imageToPrint: customCake.imageToPrint,
      snapshotFront: customCake.snapshotFront,
      snapshotSliced: customCake.snapshotSliced,
      snapshotTop: customCake.snapshotTop,
    };
  }

  async addAddon(userId: string, cartItem: CreateAddonItemDto): Promise<CartResponseDto> {
    const { addonId, isIncluded = true, quantity = 1, regionId, type } = cartItem;

    await this.addonService.findOne(addonId);
    await this.regionService.findOne(regionId);

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.addonId, addonId)))
      .limit(1);

    if (existingItem) {
      try {
        await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();

        return await this.getAll(userId, regionId);
      } catch {
        this.logger.error(`Error incrementing the quanity of the existing item`);
        throw new InternalServerErrorException(
          errorResponse(
            'Error incrementing the quanity of the existing item',
            HttpStatus.INTERNAL_SERVER_ERROR,
            'InternalServerError',
          ),
        );
      }
    }

    try {
      await db.insert(cartItems).values({
        userId,
        addonId: addonId,
        isIncluded: isIncluded,
        quantity: quantity,
        type: type,
      });

      return await this.getAll(userId, regionId);
    } catch {
      this.logger.error(`Error adding item to the cart`);
      throw new InternalServerErrorException(
        errorResponse(
          'Error adding item to the cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async addSweet(userId: string, cartItem: CreateSweetItemDto): Promise<CartResponseDto> {
    const { sweetId, isIncluded = true, quantity = 1, regionId } = cartItem;

    await this.sweetService.findOne(sweetId);
    await this.regionService.findOne(regionId);

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.sweetId, sweetId)))
      .limit(1);

    if (existingItem) {
      try {
        await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();

        return await this.getAll(userId, regionId);
      } catch {
        this.logger.error(`Error incrementing the quanity of the existing item`);
        throw new InternalServerErrorException(
          errorResponse(
            'Error incrementing the quanity of the existing item',
            HttpStatus.INTERNAL_SERVER_ERROR,
            'InternalServerError',
          ),
        );
      }
    }

    try {
      await db.insert(cartItems).values({
        userId,
        sweetId: sweetId,
        isIncluded: isIncluded,
        quantity: quantity,
        type: 'others',
      });

      return await this.getAll(userId, regionId);
    } catch {
      this.logger.error(`Error adding item to the cart`);
      throw new InternalServerErrorException(
        errorResponse(
          'Error adding item to the cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async addFeaturedCake(
    userId: string,
    cartItem: CreateFeaturedCakeItemDto,
  ): Promise<CartResponseDto> {
    const { featuredCakeId, isIncluded = true, quantity = 1, regionId, type } = cartItem;

    await this.featuredCakeService.findOne(featuredCakeId);
    await this.regionService.findOne(regionId);

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.featuredCakeId, featuredCakeId)))
      .limit(1);

    if (existingItem) {
      try {
        await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();

        return await this.getAll(userId, regionId);
      } catch {
        this.logger.error(`Error incrementing the quanity of the existing item`);
        throw new InternalServerErrorException(
          errorResponse(
            'Error incrementing the quanity of the existing item',
            HttpStatus.INTERNAL_SERVER_ERROR,
            'InternalServerError',
          ),
        );
      }
    }

    try {
      await db.insert(cartItems).values({
        userId,
        featuredCakeId: featuredCakeId,
        isIncluded: isIncluded,
        quantity: quantity,
        type: type,
      });

      return await this.getAll(userId, regionId);
    } catch {
      this.logger.error(`Error adding item to the cart`);
      throw new InternalServerErrorException(
        errorResponse(
          'Error adding item to the cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async addPredesignedCake(
    userId: string,
    cartItem: CreatePredesignedCakeItemDto,
  ): Promise<CartResponseDto> {
    const { predesignedCakeId, isIncluded = true, quantity = 1, regionId, type } = cartItem;

    await this.predesignedCakesService.findOne(predesignedCakeId);
    await this.regionService.findOne(regionId);

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.predesignedCakeId, predesignedCakeId)))
      .limit(1);

    if (existingItem) {
      try {
        await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();

        return await this.getAll(userId, regionId);
      } catch {
        this.logger.error(`Error incrementing the quanity of the existing item`);
        throw new InternalServerErrorException(
          errorResponse(
            'Error incrementing the quanity of the existing item',
            HttpStatus.INTERNAL_SERVER_ERROR,
            'InternalServerError',
          ),
        );
      }
    }

    try {
      await db.insert(cartItems).values({
        userId,
        predesignedCakeId: predesignedCakeId,
        isIncluded: isIncluded,
        quantity: quantity,
        type: type,
      });

      return await this.getAll(userId, regionId);
    } catch {
      this.logger.error(`Error adding item to the cart`);
      throw new InternalServerErrorException(
        errorResponse(
          'Error adding item to the cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async addCustomCake(userId: string, cartItem: CreateCustomCakeItemDto) {
    const {
      decorationId,
      flavorId,
      shapeId,
      color,
      extraLayers,
      message,
      isIncluded = true,
      quantity = 1,
      regionId,
      type,
      imageToPrint,
      snapshotFront,
      snapshotSliced,
      snapshotTop,
    } = cartItem;

    await this.regionService.findOne(regionId);
    await this.decorationService.findOne(decorationId);
    await this.flavorService.findOne(flavorId);
    await this.shapeService.findOne(shapeId);
    if (extraLayers.length > 0) {
      for (const layer of extraLayers) {
        await this.flavorService.findOne(layer.flavorId);
      }
    }

    try {
      await db.insert(cartItems).values({
        userId,
        isIncluded: isIncluded,
        quantity: quantity,
        type: type,
        customCake: {
          decorationId,
          flavorId,
          shapeId,
          color,
          extraLayers,
          message,
          imageToPrint,
          snapshotFront,
          snapshotSliced,
          snapshotTop,
        },
      });

      return await this.getAll(userId, regionId);
    } catch {
      this.logger.error(`Error adding item to the cart`);
      throw new InternalServerErrorException(
        errorResponse(
          'Error adding item to the cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async deleteCartItem(
    itemId: string,
    userId: string,
    { regionId }: DeleteOneDto,
  ): Promise<CartResponseDto> {
    await this.findOne(itemId, userId);
    try {
      await db.delete(cartItems).where(eq(cartItems.id, itemId));
      return await this.getAll(userId, regionId);
    } catch {
      this.logger.error(`Cart item deletion error for ${itemId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete cart item',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async bulkDelete(userId: string, { ids, regionId }: BulkDeleteDto): Promise<CartResponseDto> {
    try {
      const deletedItems = await db
        .delete(cartItems)
        .where(inArray(cartItems.id, ids))
        .returning({ deletedId: cartItems.id });

      // if (deletedItems.length !== ids.length) {
      //   const deletedIds = deletedItems.map((item) => item.deletedId);
      //   const missingIds = ids.filter((id) => !deletedIds.includes(id));
      //   this.logger.warn(`Bulk delete partial success. Missing IDs: ${missingIds.join(', ')}`);
      //   throw new BadRequestException(
      //     errorResponse(
      //       'Failed to delete cart items',
      //       HttpStatus.INTERNAL_SERVER_ERROR,
      //       'InternalServerError',
      //     ),
      //   );
      // }
      this.logger.log(`Successfully bulk deleted ${deletedItems.length} add-ons`);
      return await this.getAll(userId, regionId);
    } catch {
      this.logger.error(`Cart item deletion error`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete cart items',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async toggleCartItem(
    itemId: string,
    userId: string,
    { isIncluded, regionId }: ToggleStatusDto,
  ): Promise<CartResponseDto> {
    await this.findOne(itemId, userId);
    try {
      await db.update(cartItems).set({ isIncluded: isIncluded }).where(eq(cartItems.id, itemId));
      return await this.getAll(userId, regionId);
    } catch {
      this.logger.error(`Error toggling cart item status for ${itemId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to toggle cart item status',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async updateQuantity(
    itemId: string,
    userId: string,
    { quantity: newQuantity, regionId }: UpdateQuantityDto,
  ): Promise<CartResponseDto> {
    await this.findOne(itemId, userId);
    try {
      await db.update(cartItems).set({ quantity: newQuantity }).where(eq(cartItems.id, itemId));
      return await this.getAll(userId, regionId);
    } catch {
      this.logger.error(`Error updating cart item quantity for ${itemId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to update cart item quantity',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private async findOne(itemId: string, userId: string) {
    const [cartItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .limit(1);

    if (!cartItem) {
      throw new NotFoundException(
        errorResponse('Cart item not found', HttpStatus.NOT_FOUND, 'NotFound'),
      );
    }

    return cartItem;
  }
}
