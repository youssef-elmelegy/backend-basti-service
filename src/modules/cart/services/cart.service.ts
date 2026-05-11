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
} from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
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
} from '../dto';
import { errorResponse } from '@/utils';
import { ItemService } from '@/modules/items/item.service';

@Injectable()
export class CartService {
  constructor(
    private readonly itemService: ItemService,
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
        const [addon] = await this.itemService.getAddons([{ id: item.addonId }], regionId);
        const unitPrice =
          Number(addon.price) + (addon.options ? Number(addon.options[0].value) : 0);
        bigCartExpanded.addons.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: { 
            ...addon, 
            options: [],
            price: addon.price ?? '0',
            tagName: addon.tagName ?? '',
            tagId: addon.tagId ?? '',
          },
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.featuredCakeId) {
        const [featuredCake] = await this.itemService.getFeaturedCakes([item.featuredCakeId], regionId);
        const unitPrice = Number(featuredCake.price ?? '0');
        bigCartExpanded.featuredCakes.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: {
            ...featuredCake,
            price: featuredCake.price ?? '0',
            updatedAt: featuredCake.updatedAt.toISOString(),
            createdAt: featuredCake.createdAt.toISOString(), offer: (featuredCake as any).offer || null
          },
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.predesignedCakeId) {
        const [predesignedCake] = await this.itemService.getPredesignedCakes([item.predesignedCakeId], regionId);
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
          item: {
            ...predesignedCake,
            tagId: predesignedCake.tagId ?? '',
            configs: predesignedCake.configs.map((config) => ({
              id: config.id,
              frostColorValue: config.frostColorValue,
              createdAt: config.createdAt,
              updatedAt: config.updatedAt,
              flavor: {
                id: config.flavor.id,
                title: config.flavor.title,
                description: config.flavor.description,
                flavorUrl: config.flavor.flavorUrl,
                createdAt: config.flavor.createdAt,
                updatedAt: config.flavor.updatedAt,
              },
              decoration: {
                id: config.decoration.id,
                title: config.decoration.title,
                description: config.decoration.description,
                decorationUrl: config.decoration.decorationUrl,
                minPrepHours: config.decoration.minPrepHours,
                createdAt: config.decoration.createdAt,
                updatedAt: config.decoration.updatedAt,
              },
              shape: {
                id: config.shape.id,
                title: config.shape.title,
                description: config.shape.description,
                shapeUrl: config.shape.shapeUrl,
                minPrepHours: config.shape.minPrepHours,
                createdAt: config.shape.createdAt,
                updatedAt: config.shape.updatedAt,
              },
            })),
          },
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.customCake) {
        const [customCakeData] = await this.itemService.getCustomCakes([item.customCake], regionId);
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
          item: {
            ...customCakeData,
            decoration: {
              id: customCakeData.decoration.id,
              title: customCakeData.decoration.title,
              description: customCakeData.decoration.description,
              decorationUrl: customCakeData.decoration.decorationUrl,
              minPrepHours: customCakeData.decoration.minPrepHours,
              createdAt: customCakeData.decoration.createdAt,
              updatedAt: customCakeData.decoration.updatedAt,
            },
            flavor: {
              id: customCakeData.flavor.id,
              title: customCakeData.flavor.title,
              description: customCakeData.flavor.description,
              flavorUrl: customCakeData.flavor.flavorUrl,
              createdAt: customCakeData.flavor.createdAt,
              updatedAt: customCakeData.flavor.updatedAt,
            },
            shape: {
              id: customCakeData.shape.id,
              title: customCakeData.shape.title,
              description: customCakeData.shape.description,
              shapeUrl: customCakeData.shape.shapeUrl,
              minPrepHours: customCakeData.shape.minPrepHours,
              createdAt: customCakeData.shape.createdAt,
              updatedAt: customCakeData.shape.updatedAt,
            },
            extraLayers: customCakeData.extraLayers.map((layer) => ({
              layer: layer.layer,
              flavor: {
                id: layer.flavor.id,
                title: layer.flavor.title,
                description: layer.flavor.description,
                flavorUrl: layer.flavor.flavorUrl,
                order: layer.flavor.order,
                createdAt: layer.flavor.createdAt,
                updatedAt: layer.flavor.updatedAt,
              },
            })),
          },
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      }
    }

    for (const item of smallCart) {
      if (item.addonId) {
        const [addon] = await this.itemService.getAddons([{ id: item.addonId }], regionId);
        const unitPrice =
          Number(addon.price) + (addon.options ? Number(addon.options[0].value) : 0);
        smallCartExpanded.addons.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: { ...addon, options: [], offer: (addon as any).offer || null },
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.featuredCakeId) {
        const [featuredCake] = await this.itemService.getFeaturedCakes([item.featuredCakeId], regionId);
        const unitPrice = Number(featuredCake.price);
        bigCartExpanded.featuredCakes.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: {
            ...featuredCake,
            updatedAt: featuredCake.updatedAt.toISOString(),
            createdAt: featuredCake.createdAt.toISOString(), offer: (featuredCake as any).offer || null
          },
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.predesignedCakeId) {
        const [predesignedCake] = await this.itemService.getPredesignedCakes([item.predesignedCakeId], regionId);
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
          item: {
            ...predesignedCake,
            tagName: predesignedCake.tagName ?? '',
            configs: predesignedCake.configs.map((config) => ({
              id: config.id,
              flavor: {
                ...config.flavor,
                shapeVariantImages: [],
              },
              decoration: {
                ...config.decoration,
                shapeVariantImages: [],
              },
              shape: config.shape,
              frostColorValue: config.frostColorValue,
              createdAt: config.createdAt,
              updatedAt: config.updatedAt,
            })),
          },
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.customCake) {
        const [customCakeData] = await this.itemService.getCustomCakes([item.customCake], regionId);
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
          item: {
            ...customCakeData,
            decoration: {
              ...customCakeData.decoration,
              shapeVariantImages: [],
            },
            flavor: {
              ...customCakeData.flavor,
              shapeVariantImages: [],
            },
            shape: customCakeData.shape,
            extraLayers: customCakeData.extraLayers.map((layer) => ({
              layer: layer.layer,
              flavor: {
                ...layer.flavor,
                shapeVariantImages: [],
              },
            })),
          },
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      }
    }

    for (const item of othersCart) {
      if (item.addonId) {
        const [addon] = await this.itemService.getAddons([{ id: item.addonId }], regionId);
        const unitPrice =
          Number(addon.price) + (addon.options ? Number(addon.options[0].value) : 0);
        othersCartExpanded.addons.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: { ...addon, options: [], offer: (addon as any).offer || null },
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        });
      } else if (item.sweetId) {
        const [sweet] = await this.itemService.getSweets([item.sweetId], regionId);
        const unitPrice = Number(sweet.price);
        othersCartExpanded.sweets.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: { ...sweet, offer: (sweet as any).offer || null },
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

  async addAddon(userId: string, cartItem: CreateAddonItemDto): Promise<CartResponseDto> {
    const { addonId, isIncluded = true, quantity = 1, regionId, type } = cartItem;

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
