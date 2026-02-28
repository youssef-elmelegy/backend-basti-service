import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateOrderDto,
  OrderResponseDto,
  ChangeOrderStatusResponseDto,
  ChangeOrderStatusDto,
  CustomCakeConfigDto,
  CreateOrderResponseDto,
  AssignBakeryDto,
  AssignBakeryResponseDto,
} from '../dto';
import { db } from '@/db';
import {
  orders,
  locations,
  paymentMethods,
  orderItems,
  regionItemPrices,
  designedCakeConfigs,
  cartItems,
  bakeries,
} from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { errorResponse } from '@/utils';

import { CartService } from '@/modules/cart/services/cart.service';
import { ConfigService } from '@/modules/config/services/config.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(OrderService.name);

  async create(userId: string, orderData: CreateOrderDto): Promise<CreateOrderResponseDto> {
    const {
      locationId,
      paymentMethodId,
      cardMessage = '',
      deliveryNote = '',
      keepAnonymous = false,
      discountAmount = 0,
      cardQrCodeUrl = '',
      regionId,
      type,
    } = orderData;
    try {
      const [existingLocation] = await db
        .select()
        .from(locations)
        .where(and(eq(locations.id, locationId), eq(locations.userId, userId)))
        .limit(1);

      if (!existingLocation && !location) {
        this.logger.warn(
          `Order creation failed: Invalid location ${locationId} for user ${userId}`,
        );
        throw new BadRequestException(
          errorResponse(
            'Location ID is invalid or does not belong to the user',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [existingPaymentMethod] = await db
        .select()
        .from(paymentMethods)
        .where(and(eq(paymentMethods.id, paymentMethodId), eq(paymentMethods.userId, userId)))
        .limit(1);

      if (!existingPaymentMethod) {
        this.logger.warn(
          `Order creation failed: Invalid paymentMethod ID ${paymentMethodId} for user ${userId}`,
        );
        throw new BadRequestException(
          errorResponse(
            'Payment Method ID is invalid or does not belong to the user',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const cart = await db
        .select()
        .from(cartItems)
        .where(
          and(
            eq(cartItems.userId, userId),
            eq(cartItems.type, type),
            eq(cartItems.isIncluded, true),
          ),
        );

      const addons = cart.filter((item) => item.addonId !== null);
      const sweets = cart.filter((item) => item.sweetId !== null);
      const featuredCakes = cart.filter((item) => item.featuredCakeId !== null);
      const predesignedCakes = cart.filter((item) => item.predesignedCakeId !== null);
      const customCakes = cart.filter((item) => item.customCake !== null);

      const orderItemsDetails: Omit<typeof orderItems.$inferInsert, 'orderId'>[] = [];

      let totalPrice = 0;

      for (const addon of addons) {
        const addonPrice = await this.caclulateAddonPrice(addon.addonId, regionId);
        totalPrice += addonPrice * addon.quantity;
        orderItemsDetails.push({
          price: addonPrice.toFixed(2),
          quantity: addon.quantity,
          addonId: addon.addonId,
        });
      }

      for (const sweet of sweets) {
        const sweetPrice = await this.caclulateSweetPrice(sweet.sweetId, regionId);
        totalPrice += sweetPrice * sweet.quantity;
        orderItemsDetails.push({
          price: sweetPrice.toFixed(2),
          quantity: sweet.quantity,
          sweetId: sweet.sweetId,
        });
      }

      for (const featuredCake of featuredCakes) {
        const featuredCakePrice = await this.caclulateFeaturedCakePrice(
          featuredCake.featuredCakeId,
          regionId,
        );
        totalPrice += featuredCakePrice * featuredCake.quantity;
        orderItemsDetails.push({
          price: featuredCakePrice.toFixed(2),
          quantity: featuredCake.quantity,
          featuredCakeId: featuredCake.featuredCakeId,
        });
      }

      for (const predesignedCake of predesignedCakes) {
        const predesignedCakePrice = await this.caclulatePredesignedCakePrice(
          predesignedCake.predesignedCakeId,
          regionId,
        );
        totalPrice += predesignedCakePrice * predesignedCake.quantity;
        orderItemsDetails.push({
          price: predesignedCakePrice.toFixed(2),
          quantity: predesignedCake.quantity,
          predesignedCakeId: predesignedCake.predesignedCakeId,
        });
      }

      for (const customCake of customCakes) {
        const customCakePrice = await this.caclulateCustomCakePrice(
          customCake.customCake,
          regionId,
        );
        totalPrice += customCakePrice * customCake.quantity;
        orderItemsDetails.push({
          price: customCakePrice.toFixed(2),
          quantity: customCake.quantity,
          customCake: customCake.customCake,
        });
      }

      let finalPrice = 0;
      const willDeliverAt = await this.calculateTheExpectedDeliveryTime(type);

      finalPrice = totalPrice - discountAmount;

      const { newOrder, newItems } = await db.transaction(async (tx) => {
        const [createdOrder] = await tx
          .insert(orders)
          .values({
            userId,
            locationId,
            paymentMethodId,
            paymentMethodType: existingPaymentMethod.type,
            cardMessage,
            deliveryNote,
            keepAnonymous,
            cardQrCodeUrl,
            totalPrice: totalPrice.toFixed(2),
            finalPrice: finalPrice.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            willDeliverAt,
            cartType: type,
          })
          .returning();

        const itemsToInsert = orderItemsDetails.map((item) => ({
          orderId: createdOrder.id,
          addonId: item.addonId,
          sweetId: item.sweetId,
          featuredCakeId: item.featuredCakeId,
          predesignedCakeId: item.predesignedCakeId,
          customCake: item.customCake,
          quantity: item.quantity,
          flavor: item.flavor,
          size: item.size,
          price: item.price,
          selectedOptions: item.selectedOptions,
        }));

        if (itemsToInsert.length === 0) {
          this.logger.warn(`No items found in the cart for user ${userId} and type ${type}`);
          throw new BadRequestException(
            errorResponse('No items found in the cart', HttpStatus.BAD_REQUEST, 'BadRequest'),
          );
        }

        const newItems = await tx.insert(orderItems).values(itemsToInsert).returning();

        return { newOrder: createdOrder, newItems };
      });

      this.logger.log(`
        Order created: ${newOrder.id} for user ${userId}, with ${newItems.length} items`);

      const response: CreateOrderResponseDto = {
        id: newOrder.id,
        discountAmount: Number(newOrder.discountAmount),
        totalPrice: Number(newOrder.totalPrice),
        finalPrice: Number(newOrder.finalPrice),
        orderStatus: newOrder.orderStatus,
        willDeliverAt: newOrder.willDeliverAt,
        createdAt: newOrder.createdAt,
        items: newItems,
      };

      return response;
    } catch {
      this.logger.error(`Error placing the order`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to place the order',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getOrdersForUser(userId: string, regionId: string): Promise<OrderResponseDto[]> {
    try {
      const ordersForUser = await db.select().from(orders).where(eq(orders.userId, userId));

      const response: OrderResponseDto[] = [];

      for (const order of ordersForUser) {
        const orderDetails = await this.getOrderByIdForUser(order.id, userId, regionId);
        response.push(orderDetails);
      }

      this.logger.log(`Retrieved ${response.length} orders for user ${userId}`);
      return response;
    } catch {
      this.logger.error(`Failed to retrieve orders for user ${userId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve orders',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getOrderByIdForUser(
    orderId: string,
    userId: string,
    regionId: string,
  ): Promise<OrderResponseDto> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

      const customCakeItems: OrderResponseDto['customCakes'] = [];
      const predesignedCakeItems: OrderResponseDto['predesignedCakes'] = [];
      const featuredCakeItems: OrderResponseDto['featuredCakes'] = [];
      const addonItems: OrderResponseDto['addons'] = [];
      const sweetItems: OrderResponseDto['sweets'] = [];

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found`);
        throw new NotFoundException(
          errorResponse('Order not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      for (const item of items) {
        if (item.customCake) {
          const cc = await this.cartService.getCustomCakeComponents(item.customCake, regionId);
          customCakeItems.push({
            ...item,
            price: parseFloat(item.price),
            data: cc,
          });
        } else if (item.predesignedCakeId) {
          const pdc = await this.cartService.getPredesignedCake(item.predesignedCakeId, regionId);
          predesignedCakeItems.push({
            ...item,
            price: parseFloat(item.price),
            data: pdc,
          });
        } else if (item.featuredCakeId) {
          const fc = await this.cartService.getFeaturedCake(item.featuredCakeId, regionId);
          featuredCakeItems.push({
            ...item,
            price: parseFloat(item.price),
            data: {
              ...fc,
              createdAt: fc.createdAt.toISOString(),
              updatedAt: fc.updatedAt.toISOString(),
            },
          });
        } else if (item.addonId) {
          const addon = await this.cartService.getAddon(item.addonId, regionId);
          addonItems.push({
            ...item,
            price: parseFloat(item.price),
            data: addon,
          });
        } else if (item.sweetId) {
          const sweet = await this.cartService.getSweet(item.sweetId, regionId);
          sweetItems.push({
            ...item,
            price: parseFloat(item.price),
            data: sweet,
          });
        }
      }

      this.logger.log(`Retrieved order: ${orderId}`);
      return {
        addons: addonItems,
        sweets: sweetItems,
        featuredCakes: featuredCakeItems,
        predesignedCakes: predesignedCakeItems,
        customCakes: customCakeItems,
        ...order,
        totalPrice: parseFloat(order.totalPrice),
        discountAmount: parseFloat(order.discountAmount),
        finalPrice: parseFloat(order.finalPrice),
      };
    } catch {
      this.logger.error(`Failed to retrieve order ${orderId} for user ${userId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve the order',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getAllOrders(regionId: string): Promise<OrderResponseDto[]> {
    try {
      const allOrders = await db.select().from(orders);

      const response: OrderResponseDto[] = [];

      for (const order of allOrders) {
        const orderDetails = await this.getOrderById(order.id, regionId);
        response.push(orderDetails);
      }

      this.logger.log(`Retrieved all orders, count: ${response.length}`);
      return response;
    } catch {
      this.logger.error(`Failed to retrieve all orders`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve orders',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getOrderById(orderId: string, regionId: string): Promise<OrderResponseDto> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

      const customCakeItems: OrderResponseDto['customCakes'] = [];
      const predesignedCakeItems: OrderResponseDto['predesignedCakes'] = [];
      const featuredCakeItems: OrderResponseDto['featuredCakes'] = [];
      const addonItems: OrderResponseDto['addons'] = [];
      const sweetItems: OrderResponseDto['sweets'] = [];

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found`);
        throw new NotFoundException(
          errorResponse('Order not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      for (const item of items) {
        if (item.customCake) {
          const cc = await this.cartService.getCustomCakeComponents(item.customCake, regionId);
          customCakeItems.push({
            ...item,
            price: parseFloat(item.price),
            data: cc,
          });
        } else if (item.predesignedCakeId) {
          const pdc = await this.cartService.getPredesignedCake(item.predesignedCakeId, regionId);
          predesignedCakeItems.push({
            ...item,
            price: parseFloat(item.price),
            data: pdc,
          });
        } else if (item.featuredCakeId) {
          const fc = await this.cartService.getFeaturedCake(item.featuredCakeId, regionId);
          featuredCakeItems.push({
            ...item,
            price: parseFloat(item.price),
            data: {
              ...fc,
              createdAt: fc.createdAt.toISOString(),
              updatedAt: fc.updatedAt.toISOString(),
            },
          });
        } else if (item.addonId) {
          const addon = await this.cartService.getAddon(item.addonId, regionId);
          addonItems.push({
            ...item,
            price: parseFloat(item.price),
            data: addon,
          });
        } else if (item.sweetId) {
          const sweet = await this.cartService.getSweet(item.sweetId, regionId);
          sweetItems.push({
            ...item,
            price: parseFloat(item.price),
            data: sweet,
          });
        }
      }

      this.logger.log(`Retrieved order: ${orderId}`);
      return {
        addons: addonItems,
        sweets: sweetItems,
        featuredCakes: featuredCakeItems,
        predesignedCakes: predesignedCakeItems,
        customCakes: customCakeItems,
        ...order,
        totalPrice: parseFloat(order.totalPrice),
        discountAmount: parseFloat(order.discountAmount),
        finalPrice: parseFloat(order.finalPrice),
      };
    } catch {
      this.logger.error(`Failed to retrieve order ${orderId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve the order',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async cancelOrder(orderId: string, userId: string): Promise<ChangeOrderStatusResponseDto> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found for user: ${userId}`);
        throw new NotFoundException(
          errorResponse(
            'Order not found or you are not authorized to cancel it',
            HttpStatus.NOT_FOUND,
            'NotFoundException',
          ),
        );
      }

      if (order.orderStatus !== 'pending') {
        this.logger.warn(
          `Order with id: ${orderId} cannot be cancelled. Status: ${order.orderStatus}`,
        );
        throw new BadRequestException(
          errorResponse(
            `Order cannot be cancelled. Status: ${order.orderStatus}`,
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({ orderStatus: 'cancelled' })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, status: orders.orderStatus });

      this.logger.log(`Order ${orderId} cancelled successfully`);
      return updatedOrder;
    } catch {
      this.logger.error(`Failed to cancel order ${orderId} for user ${userId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to cancel order',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async refuseOrder(orderId: string): Promise<ChangeOrderStatusResponseDto> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found`);
        throw new NotFoundException(
          errorResponse('Order not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({ orderStatus: 'cancelled' })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, status: orders.orderStatus });

      this.logger.log(`Order ${orderId} refused (cancelled) successfully`);
      return updatedOrder;
    } catch {
      this.logger.error(`Failed to refuse order ${orderId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to refuse order',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async changeOrderStatus(
    orderId: string,
    { status }: ChangeOrderStatusDto,
  ): Promise<ChangeOrderStatusResponseDto> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found`);
        throw new NotFoundException(
          errorResponse('Order not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({ orderStatus: status })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, status: orders.orderStatus });

      this.logger.log(`Order ${orderId} status changed to ${status} successfully`);
      return updatedOrder;
    } catch {
      this.logger.error(`Failed to change order status for order ${orderId} to ${status}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to change order status',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async assignToBakery(
    orderId: string,
    { bakeryId }: AssignBakeryDto,
  ): Promise<AssignBakeryResponseDto> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found`);
        throw new NotFoundException(
          errorResponse('Order not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const [bakery] = await db.select().from(bakeries).where(eq(bakeries.id, bakeryId)).limit(1);

      if (!bakery) {
        this.logger.warn(`Bakery with id: ${bakeryId} not found`);
        throw new NotFoundException(
          errorResponse('Bakery not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({ bakeryId: bakeryId === undefined ? null : bakeryId })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, bakeryId: orders.bakeryId });

      this.logger.log(`Order ${orderId}bakeryId: orders.bakeryId successfully`);
      return updatedOrder;
    } catch {
      this.logger.error(`Failed to assign order ${orderId} to bakery ${bakeryId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to assign order to bakery',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private async calculateTheExpectedDeliveryTime(
    type: 'big_cakes' | 'small_cakes' | 'others',
  ): Promise<Date> {
    const config = await this.configService.get();

    const currentHour = new Date().getHours();
    const isWorkingHours = currentHour >= config.openingHour && currentHour < config.closingHour;

    const baseDays = type === 'big_cakes' ? 2 : 1;
    const deliveryDate = new Date();

    //?> add base days, plus 1 if outside working hours
    let daysToAdd = isWorkingHours ? baseDays : baseDays + 1;

    //?> keep adding days until we find a valid delivery date
    while (daysToAdd > 0) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);

      if (!this.isClosedDay(deliveryDate, config)) {
        daysToAdd--;
      }
    }

    //?> ff the calculated date is still a closed day, skip to the next open day
    while (this.isClosedDay(deliveryDate, config)) {
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    }

    deliveryDate.setHours(config.openingHour, 0, 0, 0);

    return deliveryDate;
  }

  private isClosedDay(
    date: Date,
    config: {
      weekendDays: number[];
      holidays: string[];
      emergencyClosures: { from: string; to: string; reason: string }[];
      isOpen: boolean;
    },
  ): boolean {
    //?> global closure check
    if (!config.isOpen) {
      return true;
    }

    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    //?> check if it's a weekend
    if (config.weekendDays.includes(dayOfWeek)) {
      return true;
    }

    //?> check if it's a holiday
    if (config.holidays.includes(dateStr)) {
      return true;
    }

    //?> check if it's within an emergency closure period
    for (const closure of config.emergencyClosures) {
      const fromDate = new Date(closure.from);
      const toDate = new Date(closure.to);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(23, 59, 59, 999);

      if (date >= fromDate && date <= toDate) {
        return true;
      }
    }

    return false;
  }

  private async caclulateAddonPrice(addonId: string, regionId: string): Promise<number> {
    const [result] = await db
      .select({ price: regionItemPrices.price })
      .from(regionItemPrices)
      .where(and(eq(regionItemPrices.addonId, addonId), eq(regionItemPrices.regionId, regionId)))
      .limit(1);

    if (!result) {
      throw new NotFoundException(
        errorResponse(
          `Price not found for addon ${addonId} in region ${regionId}`,
          HttpStatus.NOT_FOUND,
          'NotFoundException',
        ),
      );
    }

    return parseFloat(result.price);
  }

  private async caclulateSweetPrice(sweetId: string, regionId: string): Promise<number> {
    const [result] = await db
      .select({ price: regionItemPrices.price })
      .from(regionItemPrices)
      .where(and(eq(regionItemPrices.sweetId, sweetId), eq(regionItemPrices.regionId, regionId)))
      .limit(1);

    if (!result) {
      throw new NotFoundException(
        errorResponse(
          `Price not found for sweet ${sweetId} in region ${regionId}`,
          HttpStatus.NOT_FOUND,
          'NotFoundException',
        ),
      );
    }

    return parseFloat(result.price);
  }

  private async caclulateFeaturedCakePrice(
    featuredCakeId: string,
    regionId: string,
  ): Promise<number> {
    const [result] = await db
      .select({ price: regionItemPrices.price })
      .from(regionItemPrices)
      .where(
        and(
          eq(regionItemPrices.featuredCakeId, featuredCakeId),
          eq(regionItemPrices.regionId, regionId),
        ),
      )
      .limit(1);

    if (!result) {
      throw new NotFoundException(
        errorResponse(
          `Price not found for featured cake ${featuredCakeId} in region ${regionId}`,
          HttpStatus.NOT_FOUND,
          'NotFoundException',
        ),
      );
    }

    return parseFloat(result.price);
  }

  private async caclulatePredesignedCakePrice(
    predesignedCakeId: string,
    regionId: string,
  ): Promise<number> {
    const [basePrice] = await db
      .select({ price: regionItemPrices.price })
      .from(regionItemPrices)
      .where(
        and(
          eq(regionItemPrices.predesignedCakeId, predesignedCakeId),
          eq(regionItemPrices.regionId, regionId),
        ),
      )
      .limit(1);

    if (!basePrice) {
      throw new NotFoundException(
        errorResponse(
          `Price not found for predesigned cake ${predesignedCakeId} in region ${regionId}`,
          HttpStatus.NOT_FOUND,
          'NotFoundException',
        ),
      );
    }

    let total = parseFloat(basePrice.price);

    // Get all configs for this predesigned cake and sum their component prices
    const configs = await db
      .select({
        shapeId: designedCakeConfigs.shapeId,
        flavorId: designedCakeConfigs.flavorId,
        decorationId: designedCakeConfigs.decorationId,
      })
      .from(designedCakeConfigs)
      .where(eq(designedCakeConfigs.predesignedCakeId, predesignedCakeId));

    for (const config of configs) {
      const componentIds = [
        { column: regionItemPrices.shapeId, value: config.shapeId },
        { column: regionItemPrices.flavorId, value: config.flavorId },
        { column: regionItemPrices.decorationId, value: config.decorationId },
      ];

      for (const { column, value } of componentIds) {
        const [componentPrice] = await db
          .select({ price: regionItemPrices.price })
          .from(regionItemPrices)
          .where(and(eq(column, value), eq(regionItemPrices.regionId, regionId)))
          .limit(1);

        if (componentPrice) {
          total += parseFloat(componentPrice.price);
        }
      }
    }

    return total;
  }

  private async caclulateCustomCakePrice(
    customCakeData: CustomCakeConfigDto,
    regionId: string,
  ): Promise<number> {
    let total = 0;

    // Shape price
    const [shapePrice] = await db
      .select({ price: regionItemPrices.price })
      .from(regionItemPrices)
      .where(
        and(
          eq(regionItemPrices.shapeId, customCakeData.shapeId),
          eq(regionItemPrices.regionId, regionId),
        ),
      )
      .limit(1);

    if (shapePrice) {
      total += parseFloat(shapePrice.price);
    }

    // Flavor price
    const [flavorPrice] = await db
      .select({ price: regionItemPrices.price })
      .from(regionItemPrices)
      .where(
        and(
          eq(regionItemPrices.flavorId, customCakeData.flavorId),
          eq(regionItemPrices.regionId, regionId),
        ),
      )
      .limit(1);

    if (flavorPrice) {
      total += parseFloat(flavorPrice.price);
    }

    // Decoration price
    const [decorationPrice] = await db
      .select({ price: regionItemPrices.price })
      .from(regionItemPrices)
      .where(
        and(
          eq(regionItemPrices.decorationId, customCakeData.decorationId),
          eq(regionItemPrices.regionId, regionId),
        ),
      )
      .limit(1);

    if (decorationPrice) {
      total += parseFloat(decorationPrice.price);
    }

    // Extra layer flavor prices
    if (customCakeData.extraLayers && customCakeData.extraLayers.length > 0) {
      const extraFlavorIds = customCakeData.extraLayers.map((layer) => layer.flavorId);

      const extraFlavorPrices = await db
        .select({ price: regionItemPrices.price })
        .from(regionItemPrices)
        .where(
          and(
            inArray(regionItemPrices.flavorId, extraFlavorIds),
            eq(regionItemPrices.regionId, regionId),
          ),
        );

      for (const extra of extraFlavorPrices) {
        total += parseFloat(extra.price);
      }
    }

    return total;
  }
}
