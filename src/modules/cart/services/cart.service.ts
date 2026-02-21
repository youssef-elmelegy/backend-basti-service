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
  featuredCakes,
  tags,
  sweets,
  addons,
  predesignedCakes,
  shapes,
  flavors,
  decorations,
  designedCakeConfigs,
} from '@/db/schema';
import { eq, and, getTableColumns, or } from 'drizzle-orm';
import {
  CartResponseDto,
  CreateAddonItemDto,
  CreateSweetItemDto,
  CreateFeaturedCakeItemDto,
  CreatePredesignedCakeItemDto,
  CreateCustomCakeItemDto,
  TypeQueryDto,
  ToggleCartItemDto,
  UpdateQuantityDto,
  CustomCakeConfig,
  CustomCakeConfigDto,
} from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  async addAddonToCart(
    userId: string,
    cartItem: CreateAddonItemDto,
  ): Promise<SuccessResponse<CartResponseDto>> {
    const { addonId, isIncluded = true, quantity = 1 } = cartItem;

    const [addon] = await db
      .select({
        ...getTableColumns(addons),
        tagName: tags.name,
      })
      .from(addons)
      .leftJoin(tags, eq(addons.tagId, tags.id))
      .where(eq(addons.id, addonId))
      .limit(1);

    if (!addon) {
      throw new NotFoundException(
        errorResponse('Item not found', HttpStatus.NOT_FOUND, 'NotFound'),
      );
    }

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.addonId, addonId)))
      .limit(1);

    if (existingItem) {
      try {
        const [updatedItem] = await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();

        const cart = await this.getCartItemDetails(userId);

        return successResponse(
          {
            ...cart,
          },
          `Item is already in the cart, the quantity was incremented from ${existingItem.quantity} to ${updatedItem.quantity} successfully`,
          HttpStatus.OK,
        );
      } catch {
        this.logger.error(`Error incrementing the quanity of the existing item`);
        throw new InternalServerErrorException(
          errorResponse(
            'Failed to add item to the cart',
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
        type: 'others',
      });

      const cart = await this.getCartItemDetails(userId);

      return successResponse(
        {
          ...cart,
        },
        'Item added to the cart successfully',
        HttpStatus.CREATED,
      );
    } catch {
      this.logger.error(`Error adding item to the cart`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to add item to the cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async addSweetToCart(
    userId: string,
    cartItem: CreateSweetItemDto,
  ): Promise<SuccessResponse<CartResponseDto>> {
    const { sweetId, isIncluded = true, quantity = 1 } = cartItem;

    const [sweet] = await db
      .select({
        ...getTableColumns(sweets),
        tagName: tags.name,
      })
      .from(sweets)
      .leftJoin(tags, eq(sweets.tagId, tags.id))
      .where(eq(sweets.id, sweetId))
      .limit(1);

    if (!sweet) {
      throw new NotFoundException(
        errorResponse('Item not found', HttpStatus.NOT_FOUND, 'NotFound'),
      );
    }

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.sweetId, sweetId)))
      .limit(1);

    if (existingItem) {
      try {
        const [updatedItem] = await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();

        const cart = await this.getCartItemDetails(userId);

        return successResponse(
          {
            ...cart,
          },
          `Item is already in the cart, the quantity was incremented from ${existingItem.quantity} to ${updatedItem.quantity} successfully`,
          HttpStatus.OK,
        );
      } catch {
        this.logger.error(`Error incrementing the quanity of the existing item`);
        throw new InternalServerErrorException(
          errorResponse(
            'Failed to add item to the cart',
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

      const cart = await this.getCartItemDetails(userId);

      return successResponse(
        {
          ...cart,
        },
        'Item added to the cart successfully',
        HttpStatus.CREATED,
      );
    } catch {
      this.logger.error(`Error adding addon to the cart`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to add item to the cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async addFeaturedCakeToCart(
    userId: string,
    cartItem: CreateFeaturedCakeItemDto,
    { type }: TypeQueryDto,
  ): Promise<SuccessResponse<CartResponseDto>> {
    const { featuredCakeId, isIncluded = true, quantity = 1 } = cartItem;

    const [featuredCake] = await db
      .select({
        ...getTableColumns(featuredCakes),
        tagName: tags.name,
      })
      .from(featuredCakes)
      .leftJoin(tags, eq(featuredCakes.tagId, tags.id))
      .where(eq(featuredCakes.id, featuredCakeId))
      .limit(1);

    if (!featuredCake) {
      throw new NotFoundException(
        errorResponse('Item not found', HttpStatus.NOT_FOUND, 'NotFound'),
      );
    }

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.featuredCakeId, featuredCakeId)))
      .limit(1);

    if (existingItem) {
      try {
        const [updatedItem] = await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();

        const cart = await this.getCartItemDetails(userId);

        return successResponse(
          {
            ...cart,
          },
          `Item is already in the cart, the quantity was incremented from ${existingItem.quantity} to ${updatedItem.quantity} successfully`,
          HttpStatus.OK,
        );
      } catch {
        this.logger.error(`Error incrementing the quanity of the existing item`);
        throw new InternalServerErrorException(
          errorResponse(
            'Failed to add item to the cart',
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

      const cart = await this.getCartItemDetails(userId);

      return successResponse(
        {
          ...cart,
        },
        'Item added to the cart successfully',
        HttpStatus.CREATED,
      );
    } catch {
      this.logger.error(`Error adding addon to the cart`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to add item to the cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async addPredesignedCakeToCart(
    userId: string,
    cartItem: CreatePredesignedCakeItemDto,
    { type }: TypeQueryDto,
  ): Promise<SuccessResponse<CartResponseDto>> {
    const { predesignedCakeId, isIncluded = true, quantity = 1 } = cartItem;

    const [predesignedCake] = await db
      .select({
        ...getTableColumns(predesignedCakes),
        tagName: tags.name,
      })
      .from(predesignedCakes)
      .leftJoin(tags, eq(predesignedCakes.tagId, tags.id))
      .where(eq(predesignedCakes.id, predesignedCakeId))
      .limit(1);

    if (!predesignedCake) {
      throw new NotFoundException(
        errorResponse('Item not found', HttpStatus.NOT_FOUND, 'NotFound'),
      );
    }

    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, userId), eq(cartItems.predesignedCakeId, predesignedCakeId)))
      .limit(1);

    if (existingItem) {
      try {
        const [updatedItem] = await db
          .update(cartItems)
          .set({ quantity: existingItem.quantity + quantity })
          .where(eq(cartItems.id, existingItem.id))
          .returning();

        const cart = await this.getCartItemDetails(userId);

        return successResponse(
          {
            ...cart,
          },
          `Item is already in the cart, the quantity was incremented from ${existingItem.quantity} to ${updatedItem.quantity} successfully`,
          HttpStatus.OK,
        );
      } catch {
        this.logger.error(`Error incrementing the quanity of the existing item`);
        throw new InternalServerErrorException(
          errorResponse(
            'Failed to add item to the cart',
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

      const cart = await this.getCartItemDetails(userId);

      return successResponse(
        {
          ...cart,
        },
        'Item added to the cart successfully',
        HttpStatus.CREATED,
      );
    } catch {
      this.logger.error(`Error adding addon to the cart`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to add item to the cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async addCustomCakeToCart(
    userId: string,
    cartItem: CreateCustomCakeItemDto,
    { type }: TypeQueryDto,
  ): Promise<SuccessResponse<CartResponseDto>> {
    const { customCakeConfigs, isIncluded = true, quantity = 1 } = cartItem;

    const configs = await this.getCustomCakeComponents(customCakeConfigs);

    try {
      await db.insert(cartItems).values({
        userId,
        customCake: {
          configs: configs.map((c) => ({
            decorationId: c.decoration.id,
            flavorId: c.flavor.id,
            shapeId: c.shape.id,
            frostColorValue: c.frostColorValue,
          })),
        },
        isIncluded: isIncluded,
        quantity: quantity,
        type: type,
      });

      const cart = await this.getCartItemDetails(userId);

      return successResponse(
        {
          ...cart,
        },
        'Item added to the cart successfully',
        HttpStatus.CREATED,
      );
    } catch {
      this.logger.error(`Error adding addon to the cart`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to add item to the cart',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getAllCartItems(userId: string): Promise<SuccessResponse<CartResponseDto>> {
    try {
      const cart = await this.getCartItemDetails(userId);

      return successResponse(
        {
          ...cart,
        },
        'Retrived all cart items successfully',
        HttpStatus.OK,
      );
    } catch {
      this.logger.error(`Error retriving cart items`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrive cart items',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async deleteCartItem(itemId: string, userId: string): Promise<SuccessResponse<CartResponseDto>> {
    const [selectedItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .limit(1);

    if (!selectedItem) {
      throw new NotFoundException(
        errorResponse('Cart item not found', HttpStatus.NOT_FOUND, 'NotFound'),
      );
    }

    try {
      await db.delete(cartItems).where(eq(cartItems.id, itemId));

      const cart = await this.getCartItemDetails(userId);

      return successResponse(
        {
          ...cart,
        },
        'Cart item deleted successfully',
        HttpStatus.OK,
      );
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

  async toggleCartItem(
    itemId: string,
    userId: string,
    { isIncluded }: ToggleCartItemDto,
  ): Promise<SuccessResponse<CartResponseDto>> {
    const [selectedItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .limit(1);

    if (!selectedItem) {
      throw new NotFoundException(
        errorResponse('Cart item not found', HttpStatus.NOT_FOUND, 'NotFound'),
      );
    }

    try {
      await db.update(cartItems).set({ isIncluded: isIncluded }).where(eq(cartItems.id, itemId));

      const cart = await this.getCartItemDetails(userId);

      return successResponse(
        {
          ...cart,
        },
        'Cart item status toggled successfully',
        HttpStatus.OK,
      );
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
    { quantity: newQuantity }: UpdateQuantityDto,
  ): Promise<SuccessResponse<CartResponseDto>> {
    const [selectedItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, userId)))
      .limit(1);

    if (!selectedItem) {
      throw new NotFoundException(
        errorResponse('Cart item not found', HttpStatus.NOT_FOUND, 'NotFound'),
      );
    }

    try {
      await db.update(cartItems).set({ quantity: newQuantity }).where(eq(cartItems.id, itemId));

      const cart = await this.getCartItemDetails(userId);

      return successResponse(
        {
          ...cart,
        },
        'Cart item quantity updated successfully',
        HttpStatus.OK,
      );
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

  private async getCustomCakeComponents(configs: CustomCakeConfigDto[]) {
    const cakeComponents: CustomCakeConfig[] = [];

    // STUBID - FIX ME
    for (const config of configs) {
      const { decorationId, flavorId, shapeId, frostColorValue } = config;

      const [decoration] = await db
        .select({
          ...getTableColumns(decorations),
          tagName: tags.name,
        })
        .from(decorations)
        .leftJoin(tags, eq(decorations.tagId, tags.id))
        .where(eq(decorations.id, decorationId))
        .limit(1);

      if (!decoration) {
        throw new NotFoundException(
          errorResponse('Decoration not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const [flavor] = await db.select().from(flavors).where(eq(flavors.id, flavorId)).limit(1);

      if (!flavor) {
        throw new NotFoundException(
          errorResponse('Flavor not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      const [shape] = await db.select().from(shapes).where(eq(shapes.id, shapeId)).limit(1);

      if (!shape) {
        throw new NotFoundException(
          errorResponse('Shape not found', HttpStatus.NOT_FOUND, 'NotFound'),
        );
      }

      cakeComponents.push({
        decoration,
        flavor,
        shape,
        frostColorValue,
      });
    }

    return cakeComponents;
  }

  private async getPredesignedCakesComponents(predesignedCakeId: string) {
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
          createdAt: flavors.createdAt,
          updatedAt: flavors.updatedAt,
        },
        decoration: {
          id: decorations.id,
          title: decorations.title,
          description: decorations.description,
          decorationUrl: decorations.decorationUrl,
          tagId: decorations.tagId,
          tagName: tags.name,
          createdAt: decorations.createdAt,
          updatedAt: decorations.updatedAt,
        },
        shape: {
          id: shapes.id,
          title: shapes.title,
          description: shapes.description,
          shapeUrl: shapes.shapeUrl,
          createdAt: shapes.createdAt,
          updatedAt: shapes.updatedAt,
        },
      })
      .from(designedCakeConfigs)
      .innerJoin(flavors, eq(designedCakeConfigs.flavorId, flavors.id))
      .innerJoin(decorations, eq(designedCakeConfigs.decorationId, decorations.id))
      .innerJoin(shapes, eq(designedCakeConfigs.shapeId, shapes.id))
      .leftJoin(tags, eq(decorations.tagId, tags.id))
      .where(eq(designedCakeConfigs.predesignedCakeId, predesignedCakeId));

    return configs.map((config) => ({
      id: config.id,
      flavor: config.flavor,
      decoration: config.decoration,
      shape: config.shape,
      frostColorValue: config.frostColorValue,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));
  }

  private async getCartItemDetails(userId: string) {
    const cart = await db
      .select({
        ...getTableColumns(cartItems),
        sweet: {
          ...getTableColumns(sweets),
          tagName: tags.name,
        },
        addon: {
          ...getTableColumns(addons),
          tagName: tags.name,
        },
        featuredCake: {
          ...getTableColumns(featuredCakes),
          tagName: tags.name,
        },
        predesignedCake: {
          ...getTableColumns(predesignedCakes),
          tagName: tags.name,
        },
      })
      .from(cartItems)
      .leftJoin(sweets, eq(cartItems.sweetId, sweets.id))
      .leftJoin(addons, eq(cartItems.addonId, addons.id))
      .leftJoin(featuredCakes, eq(cartItems.featuredCakeId, featuredCakes.id))
      .leftJoin(predesignedCakes, eq(cartItems.predesignedCakeId, predesignedCakes.id))
      .leftJoin(
        tags,
        or(
          eq(sweets.tagId, tags.id),
          eq(addons.tagId, tags.id),
          eq(featuredCakes.tagId, tags.id),
          eq(predesignedCakes.tagId, tags.id),
        ),
      )
      .where(eq(cartItems.userId, userId));

    const bigCakes: CartResponseDto['bigCakes'] = {
      customCakes: [],
      predesignedCake: [],
      featuredCakes: [],
    };
    const smallCakes: CartResponseDto['smallCakes'] = {
      customCakes: [],
      predesignedCake: [],
      featuredCakes: [],
    };
    const others: CartResponseDto['others'] = {
      sweets: [],
      addons: [],
    };

    for (const item of cart) {
      if (item.addonId && item.addon) {
        others.addons.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: item.addon,
        });
      } else if (item.sweetId && item.sweet) {
        others.sweets.push({
          id: item.id,
          quantity: item.quantity,
          isIncluded: item.isIncluded,
          type: item.type,
          item: item.sweet,
        });
      } else if (item.featuredCakeId && item.featuredCake) {
        if (item.type === 'big_cakes') {
          bigCakes.featuredCakes.push({
            id: item.id,
            quantity: item.quantity,
            isIncluded: item.isIncluded,
            type: item.type,
            item: {
              ...item.featuredCake,
              updatedAt: item.featuredCake.updatedAt.toISOString(),
              createdAt: item.featuredCake.createdAt.toISOString(),
            },
          });
        } else {
          smallCakes.featuredCakes.push({
            id: item.id,
            quantity: item.quantity,
            isIncluded: item.isIncluded,
            type: item.type,
            item: {
              ...item.featuredCake,
              updatedAt: item.featuredCake.updatedAt.toISOString(),
              createdAt: item.featuredCake.createdAt.toISOString(),
            },
          });
        }
      } else if (item.predesignedCakeId && item.predesignedCake) {
        const predesignedCakeData = await this.getPredesignedCakesComponents(
          item.predesignedCakeId,
        );
        if (item.type === 'big_cakes') {
          bigCakes.predesignedCake.push({
            id: item.id,
            quantity: item.quantity,
            isIncluded: item.isIncluded,
            type: item.type,
            item: {
              ...item.predesignedCake,
              configs: predesignedCakeData,
            },
          });
        } else {
          smallCakes.predesignedCake.push({
            id: item.id,
            quantity: item.quantity,
            isIncluded: item.isIncluded,
            type: item.type,
            item: {
              ...item.predesignedCake,
              configs: predesignedCakeData,
            },
          });
        }
      } else if (item.customCake) {
        const customCakeData = await this.getCustomCakeComponents(item.customCake.configs);
        if (item.type === 'big_cakes') {
          bigCakes.customCakes.push({
            id: item.id,
            quantity: item.quantity,
            isIncluded: item.isIncluded,
            type: item.type,
            item: {
              ...item.customCake,
              configs: customCakeData,
            },
          });
        } else {
          smallCakes.customCakes.push({
            id: item.id,
            quantity: item.quantity,
            isIncluded: item.isIncluded,
            type: item.type,
            item: {
              ...item.customCake,
              configs: customCakeData,
            },
          });
        }
      }
    }

    return {
      bigCakes,
      smallCakes,
      others,
    };
  }
}
