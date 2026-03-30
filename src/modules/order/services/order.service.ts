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
  GetDeliveryDateResponseDto,
  GetDeliveryDateDto,
} from '../dto';
import { db } from '@/db';
import {
  orders,
  locations,
  paymentMethods,
  orderItems,
  cartItems,
  bakeries,
  users,
  regions,
  regionItemPrices,
} from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { errorResponse } from '@/utils';
import { randomBytes } from 'crypto';

import { CartService } from '@/modules/cart/services/cart.service';
import { ConfigService } from '@/modules/config/services/config.service';
import { ItemService } from '@/modules/order/services/item.service';
import { StockService } from '@/modules/order/services/stock.service';

/* eslint-disable */
@Injectable()
export class OrderService {
  constructor(
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
    private readonly itemService: ItemService,
    private readonly stockService: StockService,
  ) {}

  private readonly logger = new Logger(OrderService.name);

  private getAddonQuantityKey(addonId: string, optionId?: string): string {
    return `${addonId}::${optionId ?? ''}`;
  }

  async create(orderData: CreateOrderDto, userId: string): Promise<CreateOrderResponseDto> {
    const {
      locationId,
      locationData,
      paymentMethodId,
      paymentMethodData,
      orderItemsData,
      deliveryNote = '',
      keepAnonymous = false,
      discountAmount = 0,
      regionId,
      type,
      cardMessage,
      recipientData,
      wantedDeliveryDate,
      wantedDeliveryTimeSlot,
    } = orderData;

    try {
      let connectedLocation: typeof locations.$inferInsert;
      let connectedPaymentMethod: typeof paymentMethods.$inferInsert;
      let cart: (typeof cartItems.$inferSelect)[] = [];

      const [region] = await db.select().from(regions).where(eq(regions.id, regionId)).limit(1);

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!user) {
        this.logger.warn(`User not found`);
        throw new BadRequestException(
          errorResponse('User not found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      if (locationId) {
        const [location] = await db
          .select()
          .from(locations)
          .where(and(eq(locations.id, locationId), eq(locations.userId, userId)))
          .limit(1);

        if (!location) {
          this.logger.warn(
            `Location ID ${locationId} is invalid or does not belong to the user ${userId}`,
          );
          throw new BadRequestException(
            errorResponse(
              'Invalid location ID or location does not belong to the user',
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
            ),
          );
        }
        connectedLocation = location;
      }

      if (paymentMethodId) {
        const [paymentMethod] = await db
          .select()
          .from(paymentMethods)
          .where(and(eq(paymentMethods.id, paymentMethodId), eq(paymentMethods.userId, userId)))
          .limit(1);

        if (!paymentMethod) {
          this.logger.warn(
            `Payment method ID ${paymentMethodId} is invalid or does not belong to the user ${userId}`,
          );
          throw new BadRequestException(
            errorResponse(
              'Invalid Payment method ID or location does not belong to the user',
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
            ),
          );
        }
        connectedPaymentMethod = paymentMethod;
      }

      if (!orderItemsData || orderItemsData.length === 0) {
        cart = await db
          .select()
          .from(cartItems)
          .where(
            and(
              eq(cartItems.userId, userId),
              eq(cartItems.type, type),
              eq(cartItems.isIncluded, true),
            ),
          );

        if (!cart || cart.length === 0) {
          this.logger.warn(`Cart is empty for user ${userId} and type ${type}`);
          throw new BadRequestException(
            errorResponse(
              `Cart is empty for user ${userId} and type ${type}`,
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
            ),
          );
        }
      }

      const useOrderItemsData = orderItemsData && orderItemsData.length > 0;

      const cartItems$ = cart || [];

      const addonsItems = useOrderItemsData
        ? orderItemsData.filter((item) => item.addonId)
        : cartItems$.filter((item) => item.addonId);
      const sweetsItems = useOrderItemsData
        ? orderItemsData.filter((item) => item.sweetId)
        : cartItems$.filter((item) => item.sweetId);
      const featuredCakesItems = useOrderItemsData
        ? orderItemsData.filter((item) => item.featuredCakeId)
        : cartItems$.filter((item) => item.featuredCakeId);
      const predesignedCakesItems = useOrderItemsData
        ? orderItemsData.filter((item) => item.predesignedCakeId)
        : cartItems$.filter((item) => item.predesignedCakeId);
      const customCakesItems = useOrderItemsData
        ? orderItemsData.filter((item) => item.customCakeConfig)
        : cartItems$.filter((item) => item.customCake);

      const orderItemsDetails: Omit<typeof orderItems.$inferInsert, 'orderId'>[] = [];

      let totalPrice = 0;
      let totalCapacity = 0;

      const quantityCash: Record<string, number> = {};

      addonsItems.forEach((item) => {
        const addonQuantityKey = this.getAddonQuantityKey(item.addonId, item.addonOption);
        quantityCash[addonQuantityKey] = (quantityCash[addonQuantityKey] ?? 0) + item.quantity;
      });
      const addonsData = await this.itemService.getAddons(
        addonsItems.map((item) => ({ id: item.addonId, option: item.addonOption })),
        regionId,
      );
      for (const addon of addonsData) {
        const addonQuantityKey = this.getAddonQuantityKey(addon.id, addon.selectedOptionId);
        const qnt = quantityCash[addonQuantityKey] ?? 0;
        totalPrice += parseFloat(addon.price ?? '0') * qnt;
        orderItemsDetails.push({
          addon: addon,
          price: addon.price ?? '0',
          quantity: qnt,
          selectedOptions: addon.options.map((option) => ({
            optionId: option.id,
            type: option.type,
            label: option.label,
            value: option.value,
            imageUrl: option.imageUrl,
          })),
        });
      }

      sweetsItems.forEach((item) => {
        quantityCash[item.sweetId] = item.quantity;
      });
      const sweetsData = await this.itemService.getSweets(
        sweetsItems.map((item) => item.sweetId),
        regionId,
      );
      for (const sweet of sweetsData) {
        const qnt = quantityCash[sweet.id] ?? 0;
        totalPrice += parseFloat(sweet.price ?? '0') * qnt;
        orderItemsDetails.push({
          sweet: sweet,
          price: sweet.price ?? '0',
          quantity: qnt,
          selectedOptions: [],
        });
      }

      featuredCakesItems.forEach((item) => {
        quantityCash[item.featuredCakeId] = item.quantity;
      });
      const featuredCakesData = await this.itemService.getFeaturedCakes(
        featuredCakesItems.map((item) => item.featuredCakeId),
        regionId,
      );
      for (const featuredCake of featuredCakesData) {
        const qnt = quantityCash[featuredCake.id] ?? 0;
        totalPrice += parseFloat(featuredCake.price ?? '0') * qnt;
        totalCapacity += featuredCake.capacity ?? 0;
        orderItemsDetails.push({
          featuredCake: featuredCake,
          price: featuredCake.price ?? '0',
          quantity: qnt,
          selectedOptions: [],
        });
      }

      predesignedCakesItems.forEach((item) => {
        quantityCash[item.predesignedCakeId] = item.quantity;
      });
      const predesignedCakesData = await this.itemService.getPredesignedCakes(
        predesignedCakesItems.map((item) => item.predesignedCakeId),
        regionId,
      );
      for (const predesignedCake of predesignedCakesData) {
        const qnt = quantityCash[predesignedCake.id] ?? 0;
        totalPrice += parseFloat(predesignedCake.price ?? '0') * qnt;
        totalCapacity += predesignedCake.totalCapacity ?? 0;
        orderItemsDetails.push({
          predesignedCake: predesignedCake,
          price: predesignedCake.price ?? '0',
          quantity: qnt,
          selectedOptions: [],
        });
      }

      customCakesItems.forEach((item) => {
        const customCakeConfig = 'customCake' in item ? item.customCake : item.customCakeConfig;
        const uniqueid = this.itemService.getCustomCakeId(
          customCakeConfig.shapeId,
          customCakeConfig.flavorId,
          customCakeConfig.decorationId,
          customCakeConfig.color.hex,
        );
        quantityCash[uniqueid] = item.quantity;
      });
      const customCakesData = await this.itemService.getCustomCakes(
        customCakesItems
          .map((item) => ('customCake' in item ? item.customCake : item.customCakeConfig))
          .filter((customCake): customCake is CustomCakeConfigDto => Boolean(customCake)),
        regionId,
      );
      for (const customCake of customCakesData) {
        const qnt = customCake.id ? (quantityCash[customCake.id] ?? 0) : 0;
        console.log(customCake.id, qnt);
        totalPrice += parseFloat(customCake.price ?? '0') * qnt;
        totalCapacity += customCake.totalCapacity ?? 0;
        orderItemsDetails.push({
          customCake: customCake,
          price: customCake.price ?? '0',
          quantity: qnt,
          selectedOptions: [],
        });
      }

      let finalPrice = 0;
      const willDeliverAt = await this.calculateTheExpectedDeliveryTime(type, wantedDeliveryDate);

      finalPrice = totalPrice - discountAmount;

      const referenceNumber = this.generateOrderReference();

      const { newOrder, newItems } = await db.transaction(async (tx) => {
        const [createdOrder] = await tx
          .insert(orders)
          .values({
            referenceNumber,
            userId: userId,
            regionId: region.id,
            regionName: region.name,
            userData: {
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              phoneNumber: user.phoneNumber || '',
            },
            locationId,
            locationData: {
              label: connectedLocation?.label || locationData?.label || '',
              buildingNo: connectedLocation?.buildingNo || locationData?.buildingNo || '',
              street: connectedLocation?.street || locationData?.street || '',
              description: connectedLocation?.description || locationData?.description || '',
              latitude: Number(connectedLocation?.latitude || locationData?.latitude || 0),
              longitude: Number(connectedLocation?.longitude || locationData?.longitude || 0),
            },
            paymentMethodId: connectedPaymentMethod?.id || paymentMethodId || null,
            paymentMethodType: connectedPaymentMethod?.type || paymentMethodData?.type || 'cash',
            paymentData: {
              type: connectedPaymentMethod?.type || paymentMethodData?.type || 'cash',
              cardHolderName:
                connectedPaymentMethod?.cardHolderName || paymentMethodData?.cardHolderName || '',
              cardLastFourDigits:
                connectedPaymentMethod?.cardLastFourDigits ||
                paymentMethodData?.cardLastFourDigits ||
                '',
              cardExpiryMonth: Number(
                connectedPaymentMethod?.cardExpiryMonth || paymentMethodData?.cardExpiryMonth || 0,
              ),
              cardExpiryYear: Number(
                connectedPaymentMethod?.cardExpiryYear || paymentMethodData?.cardExpiryYear || 0,
              ),
            },
            cardMessage,
            deliveryNote,
            keepAnonymous,
            recipientData,
            wantedDeliveryDate: wantedDeliveryDate ? new Date(wantedDeliveryDate) : undefined,
            wantedDeliveryTimeSlot: wantedDeliveryTimeSlot,
            totalPrice: totalPrice.toFixed(2),
            finalPrice: finalPrice.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            totalCapacity: totalCapacity || 0,
            willDeliverAt: willDeliverAt,
            cartType: type,
            orderStatus: 'pending',
          })
          .returning();

        const itemsToInsert = orderItemsDetails.map((item) => ({
          orderId: createdOrder.id,
          addonId: item.addon?.id,
          sweetId: item.sweet?.id,
          addon: item.addon,
          sweet: item.sweet,
          featuredCake: item.featuredCake,
          predesignedCake: item.predesignedCake,
          featuredCakeId: item.featuredCake?.id,
          predesignedCakeId: item.predesignedCake?.id,
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

      this.logger.log(
        `Order created: ${newOrder.id} for user ${userId}, with ${newItems.length} items`,
      );

      const response: CreateOrderResponseDto = {
        ...newOrder,
        bakeryId: undefined,
        locationId: newOrder.locationId || null,
        paymentMethodId: newOrder.paymentMethodId || null,
        paymentData: newOrder.paymentData || null,
        totalCapacity: newOrder.totalCapacity || 0,
        deliveryNote: newOrder.deliveryNote || '',
        cardMessage: newOrder.cardMessage || null,
        recipientData: newOrder.recipientData || null,
        totalPrice: parseFloat(newOrder.totalPrice),
        willDeliverAt: new Date(newOrder.willDeliverAt),
        wantedDeliveryTimeSlot: newOrder.wantedDeliveryTimeSlot || null,
        wantedDeliveryDate: newOrder.wantedDeliveryDate
          ? new Date(newOrder.wantedDeliveryDate)
          : null,
        deliveredAt: null,
        discountAmount: parseFloat(newOrder.discountAmount),
        finalPrice: parseFloat(newOrder.finalPrice),
        orderStatus: newOrder.orderStatus || 'pending',
        items: newItems.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          addonId: item.addonId,
          sweetId: item.sweetId,
          featuredCakeId: item.featuredCakeId,
          predesignedCakeId: item.predesignedCakeId,
          customCake: null,
          quantity: item.quantity,
          size: item.size,
          flavor: item.flavor,
          price: item.price,
          selectedOptions: item.selectedOptions || [],
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        })),
      };

      return response;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      const errMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : '';
      this.logger.error(`Error placing the order: ${errMsg}`);
      this.logger.error(`Stack trace: ${stack}`);

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

      const validOrderIds = ordersForUser
        .map((order) => order.id)
        .filter((orderId): orderId is string => Boolean(orderId));

      const response = await Promise.all(
        validOrderIds.map((orderId) => this.getOrderByIdForUser(orderId, userId, regionId)),
      );

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

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found`);
        throw new NotFoundException(
          errorResponse('Order not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const formattedItems = await this.formatOrderItemsResponse(items, regionId ?? order.regionId);

      this.logger.log(`Retrieved order: ${orderId}`);
      return {
        addons: formattedItems.addonItems,
        sweets: formattedItems.sweetItems,
        featuredCakes: formattedItems.featuredCakeItems,
        predesignedCakes: formattedItems.predesignedCakeItems,
        customCakes: formattedItems.customCakeItems,
        ...order,
        bakeryId: order.bakeryId || undefined,
        totalCapacity: order.totalCapacity || 0,
        deliveryNote: order.deliveryNote || '',
        totalPrice: parseFloat(order.totalPrice),
        discountAmount: parseFloat(order.discountAmount),
        finalPrice: parseFloat(order.finalPrice),
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve order ${orderId} for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve the order',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getAllOrders(regionId?: string, status?: string[]): Promise<OrderResponseDto[]> {
    try {
      let allOrders = await db.select().from(orders);

      // Filter by status(es) if provided
      if (status && status.length > 0) {
        allOrders = allOrders.filter((order) =>
          this.matchesStatusFilter(order.orderStatus, status),
        );
      }

      if (regionId) {
        allOrders = allOrders.filter((order) => order.regionId === regionId);
      }

      const orderIds = allOrders
        .map((order) => order.id)
        .filter((orderId): orderId is string => Boolean(orderId));

      const allOrderItems =
        orderIds.length > 0
          ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
          : [];

      const groupedItems = this.groupOrderItemsByOrderId(allOrderItems);

      // Process all orders concurrently with per-order fallback
      const response = await Promise.all(
        allOrders.map(async (order): Promise<OrderResponseDto> => {
          try {
            if (!order.id) {
              throw new Error('Order id is missing');
            }

            const formattedItems = await this.formatOrderItemsResponse(
              groupedItems[order.id] || [],
              regionId ?? order.regionId,
            );

            return this.buildOrderResponse(order, formattedItems);
          } catch {
            this.logger.warn(
              `Failed to retrieve full details for order ${order.id}, returning basic order data`,
            );

            return this.buildBasicOrderResponse(order);
          }
        }),
      );

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

  async getBakeryOrders(
    bakeryId: string,
    regionId?: string,
    status?: string[],
  ): Promise<OrderResponseDto[]> {
    try {
      // Verify bakery exists
      const [bakery] = await db.select().from(bakeries).where(eq(bakeries.id, bakeryId)).limit(1);

      if (!bakery) {
        this.logger.warn(`Bakery with id: ${bakeryId} not found`);
        throw new NotFoundException(
          errorResponse('Bakery not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      let bakeryOrders = await db.select().from(orders).where(eq(orders.bakeryId, bakeryId));

      // Filter by status(es) if provided
      if (status && status.length > 0) {
        bakeryOrders = bakeryOrders.filter((order) =>
          this.matchesStatusFilter(order.orderStatus, status),
        );
      }

      if (regionId) {
        bakeryOrders = bakeryOrders.filter((order) => order.regionId === regionId);
      }

      const orderIds = bakeryOrders
        .map((order) => order.id)
        .filter((orderId): orderId is string => Boolean(orderId));

      const allOrderItems =
        orderIds.length > 0
          ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
          : [];

      const groupedItems = this.groupOrderItemsByOrderId(allOrderItems);

      // Process all bakery orders concurrently with per-order fallback
      const response = await Promise.all(
        bakeryOrders.map(async (order): Promise<OrderResponseDto> => {
          try {
            if (!order.id) {
              throw new Error('Order id is missing');
            }

            const formattedItems = await this.formatOrderItemsResponse(
              groupedItems[order.id] || [],
              regionId ?? order.regionId,
            );

            return this.buildOrderResponse(order, formattedItems);
          } catch {
            this.logger.warn(
              `Failed to retrieve full details for order ${order.id}, returning basic order data`,
            );

            await this.confirmAssignedOrder(order);

            return this.buildBasicOrderResponse(order);
          }
        }),
      );

      this.logger.log(`Retrieved orders for bakery ${bakeryId}, count: ${response.length}`);
      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve bakery orders for bakery ${bakeryId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve bakery orders',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getOrderById(orderId: string, regionId?: string): Promise<OrderResponseDto> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

      this.logger.log(`Fetching order details for order ID: ${orderId} with ${items.length} items`);

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found`);
        throw new NotFoundException(
          errorResponse('Order not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const formattedItems = await this.formatOrderItemsResponse(items, regionId ?? order.regionId);

      this.logger.log(`Retrieved order: ${orderId}`);
      return {
        addons: formattedItems.addonItems,
        sweets: formattedItems.sweetItems,
        featuredCakes: formattedItems.featuredCakeItems,
        predesignedCakes: formattedItems.predesignedCakeItems,
        customCakes: formattedItems.customCakeItems,
        ...order,
        bakeryId: order.bakeryId || undefined,
        totalCapacity: order.totalCapacity || 0,
        deliveryNote: order.deliveryNote || '',
        totalPrice: parseFloat(order.totalPrice),
        discountAmount: parseFloat(order.discountAmount),
        finalPrice: parseFloat(order.finalPrice),
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve order ${orderId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : '',
      );
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

      if (order.orderStatus !== 'pending' && order.orderStatus !== null) {
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
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      const errMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : '';
      this.logger.error(`Error cancelling the order: ${errMsg}`);
      this.logger.error(`Stack trace: ${stack}`);

      throw new InternalServerErrorException(
        errorResponse(
          'Failed to cancel the order',
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
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

    if (!order) {
      this.logger.warn(`Order with id: ${orderId} not found`);
      throw new NotFoundException(
        errorResponse('Order not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (order.orderStatus !== 'pending') {
      this.logger.warn(
        `Order with id: ${orderId} must be in pending status to be assigned to a bakery. Current status: ${order.orderStatus}`,
      );
      throw new BadRequestException(
        errorResponse(
          `Order with id: ${orderId} must be in pending status to be assigned to a bakery. Current status: ${order.orderStatus}`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    const [bakery] = await db.select().from(bakeries).where(eq(bakeries.id, bakeryId)).limit(1);

    if (!bakery) {
      this.logger.warn(`Bakery with id: ${bakeryId} not found`);
      throw new NotFoundException(
        errorResponse('Bakery not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (bakery.regionId !== order.regionId) {
      this.logger.warn(
        `Bakery with id: ${bakeryId} does not belong to the same region as the order`,
      );
      throw new BadRequestException(
        errorResponse(
          `Bakery with id: ${bakeryId} does not belong to the same region as the order`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    try {
      const [updatedOrder] = await db
        .update(orders)
        .set({
          bakeryId: bakeryId,
          assigningDate: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, bakeryId: orders.bakeryId });

      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        if (item.addonId || item.sweetId || item.featuredCakeId) {
          const regionItemCondition = item.addonId
            ? eq(regionItemPrices.addonId, item.addonId)
            : item.sweetId
              ? eq(regionItemPrices.sweetId, item.sweetId)
              : eq(regionItemPrices.featuredCakeId, item.featuredCakeId as string);

          const [regionItem] = await db
            .select()
            .from(regionItemPrices)
            .where(and(eq(regionItemPrices.regionId, order.regionId), regionItemCondition))
            .limit(1);

          if (regionItem) {
            await this.stockService.decrementStock(
              bakeryId,
              regionItem.id,
              item.quantity,
              item.selectedOptions && item.selectedOptions[0].optionId,
            );
          }
        }
      }

      this.logger.log(`Order ${orderId} assigned to bakery ${bakeryId} successfully`);
      return {
        id: updatedOrder.id,
        bakeryId: updatedOrder.bakeryId || '',
      };
    } catch (error) {
      this.logger.error(`Failed to assign order ${orderId} to bakery ${bakeryId}:`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to assign order to bakery',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async unassignFromBakery(
    orderId: string,
    reason?: string,
  ): Promise<{ id: string; bakeryId: string }> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

    if (!order) {
      this.logger.warn(`Order with id: ${orderId} not found`);
      throw new NotFoundException(
        errorResponse('Order not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (!order.bakeryId) {
      this.logger.warn(`Order with id: ${orderId} is not assigned to a bakery`);
      throw new BadRequestException(
        errorResponse(
          `Order with id: ${orderId} is not assigned to a bakery`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    if (order.orderStatus !== 'pending') {
      this.logger.warn(
        `Order with id: ${orderId} must be in pending status to be un-assigned from a bakery. Current status: ${order.orderStatus}`,
      );
      throw new BadRequestException(
        errorResponse(
          `Order with id: ${orderId} must be in pending status to be un-assigned from a bakery. Current status: ${order.orderStatus}`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    if (!order.assigningDate || !order.bakeryId) {
      this.logger.warn(`Order with id: ${orderId} is not assigned to a bakery`);
      throw new BadRequestException(
        errorResponse(
          `Order with id: ${orderId} is not assigned to a bakery`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    if (
      order.assigningDate &&
      new Date().getTime() - new Date(order.assigningDate).getTime() > 60 * 60 * 1000
    ) {
      this.logger.warn(
        `Order with id: ${orderId} has been assigned to a bakery since more than 1 hour, so it cannot be unassigned`,
      );
      throw new BadRequestException(
        errorResponse(
          `Order with id: ${orderId} has been assigned to a bakery since more than 1 hour, so it cannot be unassigned`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    // Log the reason if provided
    if (reason) {
      this.logger.log(`Unassigning order ${orderId} from bakery. Reason: ${reason}`);
    } else {
      this.logger.log(`Unassigning order ${orderId} from bakery`);
    }

    try {
      const bakeryIdToUnassign = order.bakeryId;
      const [updatedOrder] = await db
        .update(orders)
        .set({
          bakeryId: null,
          assigningDate: null,
          orderStatus: 'pending',
        })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, bakeryId: orders.bakeryId });

      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

      for (const item of items) {
        if (item.addonId || item.sweetId || item.featuredCakeId) {
          const regionItemCondition = item.addonId
            ? eq(regionItemPrices.addonId, item.addonId)
            : item.sweetId
              ? eq(regionItemPrices.sweetId, item.sweetId)
              : eq(regionItemPrices.featuredCakeId, item.featuredCakeId as string);

          const [regionItem] = await db
            .select()
            .from(regionItemPrices)
            .where(and(eq(regionItemPrices.regionId, order.regionId), regionItemCondition))
            .limit(1);

          if (regionItem) {
            await this.stockService.incrementStock(
              bakeryIdToUnassign,
              regionItem.id,
              item.quantity,
              item.selectedOptions && item.selectedOptions[0].optionId,
            );
          }
        }
      }

      this.logger.log(`Order ${orderId} successfully unassigned from bakery`);
      return {
        id: updatedOrder.id,
        bakeryId: updatedOrder.bakeryId || '',
      };
    } catch (error) {
      this.logger.error(`Failed to unassign order ${orderId} from bakery:`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to unassign order from bakery',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getDeliveryDate(
    getDeliveryDateDto: GetDeliveryDateDto,
  ): Promise<GetDeliveryDateResponseDto> {
    const { type } = getDeliveryDateDto;

    const res = await this.calculateTheExpectedDeliveryTime(type);
    const configs = await this.configService.get();

    return {
      details: '',
      nearestDeliveryDate: res,
      configs,
    };
  }

  private async calculateTheExpectedDeliveryTime(
    type: 'big_cakes' | 'small_cakes' | 'others',
    wantedDate?: string,
  ): Promise<Date> {
    const config = await this.configService.get();

    const currentHour = new Date().getHours();
    const isWorkingHours = currentHour >= config.openingHour && currentHour < config.closingHour;

    const baseDays = type === 'big_cakes' ? 2 : 1;

    //?> Calculate minimum delivery date based on preparation time
    const minDeliveryDate = new Date();
    let daysToAdd = type === 'others' ? 1 : isWorkingHours ? baseDays : baseDays + 1;

    while (daysToAdd > 0) {
      minDeliveryDate.setDate(minDeliveryDate.getDate() + 1);

      if (!this.isClosedDay(minDeliveryDate, config)) {
        daysToAdd--;
      }
    }

    while (this.isClosedDay(minDeliveryDate, config)) {
      minDeliveryDate.setDate(minDeliveryDate.getDate() + 1);
    }

    minDeliveryDate.setHours(config.openingHour, 0, 0, 0);

    //?> If wantedDate is provided, validate and use it
    if (wantedDate) {
      const requestedDate = new Date(wantedDate);

      //?> Check if requested date is valid
      if (isNaN(requestedDate.getTime())) {
        this.logger.warn(`Invalid wantedDate provided: ${wantedDate}`);
        return minDeliveryDate;
      }

      //?> Check if requested date is after minimum delivery date
      if (requestedDate >= minDeliveryDate) {
        //?> Check if requested date is not a closed day
        if (!this.isClosedDay(requestedDate, config)) {
          //?> Ensure delivery is within working hours
          if (requestedDate.getHours() < config.openingHour) {
            requestedDate.setHours(config.openingHour, 0, 0, 0);
          } else if (requestedDate.getHours() >= config.closingHour) {
            requestedDate.setHours(config.closingHour - 1, 0, 0, 0);
          }
          return requestedDate;
        } else {
          //?> If requested date is a closed day, find the next open day
          const adjustedDate = new Date(requestedDate);
          while (this.isClosedDay(adjustedDate, config)) {
            adjustedDate.setDate(adjustedDate.getDate() + 1);
          }
          adjustedDate.setHours(config.openingHour, 0, 0, 0);
          return adjustedDate;
        }
      }

      //?> Requested date is before minimum delivery date, use minimum
      this.logger.warn(
        `Requested date ${wantedDate} is before minimum delivery date. Using minimum.`,
      );
    }

    return minDeliveryDate;
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

  private generateOrderReference(): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
  }

  private matchesStatusFilter(
    orderStatus: typeof orders.$inferSelect.orderStatus,
    statusFilters: string[],
  ): boolean {
    const normalizedFilters = statusFilters.map((status) => status.trim().toLowerCase());

    if (orderStatus === null) {
      return normalizedFilters.includes('null');
    }

    return normalizedFilters.includes(orderStatus.toLowerCase());
  }

  private async confirmAssignedOrder(order: typeof orders.$inferSelect): Promise<void> {
    try {
      if (
        order.orderStatus === 'pending' &&
        order.bakeryId &&
        order.assigningDate &&
        new Date().getTime() - new Date(order.assigningDate).getTime() > 60 * 60 * 1000
      ) {
        this.logger.warn(
          `Order with id: ${order.id} has been assigned to a bakery for more than 1 hour, it cannot be unassigned, now changing its status to confirmed`,
        );
        await db
          .update(orders)
          .set({
            orderStatus: 'confirmed',
          })
          .where(eq(orders.id, order.id));
      }
    } catch (error) {
      this.logger.error(
        `Failed to confirm assigned order ${order.id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : '',
      );
    }
  }

  private groupOrderItemsByOrderId(
    items: (typeof orderItems.$inferSelect)[],
  ): Record<string, (typeof orderItems.$inferSelect)[]> {
    return items.reduce<Record<string, (typeof orderItems.$inferSelect)[]>>((acc, item) => {
      if (!acc[item.orderId]) {
        acc[item.orderId] = [];
      }
      acc[item.orderId].push(item);
      return acc;
    }, {});
  }

  private buildBasicOrderResponse(order: typeof orders.$inferSelect): OrderResponseDto {
    return {
      addons: [],
      sweets: [],
      featuredCakes: [],
      predesignedCakes: [],
      customCakes: [],
      ...order,
      bakeryId: order.bakeryId || undefined,
      totalCapacity: order.totalCapacity || 0,
      deliveryNote: order.deliveryNote || '',
      totalPrice: parseFloat(order.totalPrice),
      discountAmount: parseFloat(order.discountAmount),
      finalPrice: parseFloat(order.finalPrice),
    };
  }

  private buildOrderResponse(
    order: typeof orders.$inferSelect,
    formattedItems: {
      customCakeItems: OrderResponseDto['customCakes'];
      predesignedCakeItems: OrderResponseDto['predesignedCakes'];
      featuredCakeItems: OrderResponseDto['featuredCakes'];
      addonItems: OrderResponseDto['addons'];
      sweetItems: OrderResponseDto['sweets'];
    },
  ): OrderResponseDto {
    return {
      addons: formattedItems.addonItems,
      sweets: formattedItems.sweetItems,
      featuredCakes: formattedItems.featuredCakeItems,
      predesignedCakes: formattedItems.predesignedCakeItems,
      customCakes: formattedItems.customCakeItems,
      ...order,
      bakeryId: order.bakeryId || undefined,
      totalCapacity: order.totalCapacity || 0,
      deliveryNote: order.deliveryNote || '',
      totalPrice: parseFloat(order.totalPrice),
      discountAmount: parseFloat(order.discountAmount),
      finalPrice: parseFloat(order.finalPrice),
    };
  }

  private async formatOrderItemsResponse(
    items: (typeof orderItems.$inferSelect)[],
    regionId: string,
  ) {
    const customCakeItems: OrderResponseDto['customCakes'] = [];
    const predesignedCakeItems: OrderResponseDto['predesignedCakes'] = [];
    const featuredCakeItems: OrderResponseDto['featuredCakes'] = [];
    const addonItems: OrderResponseDto['addons'] = [];
    const sweetItems: OrderResponseDto['sweets'] = [];

    for (const item of items) {
      if (item.customCake) {
        customCakeItems.push({
          data: {
            color: item.customCake.color,
            extraLayers: item.customCake.extraLayers.map((layer) => ({
              layer: layer.layer,
              flavor: {
                id: layer.flavor.id,
                title: layer.flavor.title,
                description: layer.flavor.description,
                order: layer.flavor.order,
                flavorUrl: layer.flavor.flavorUrl,
                createdAt: layer.flavor.createdAt,
                updatedAt: layer.flavor.updatedAt,
              },
            })),
            flavor: {
              id: item.customCake.flavor.id,
              title: item.customCake.flavor.title,
              description: item.customCake.flavor.description,
              flavorUrl: item.customCake.flavor.flavorUrl,
              createdAt: item.customCake.flavor.createdAt,
              updatedAt: item.customCake.flavor.updatedAt,
            },
            decoration: {
              id: item.customCake.decoration.id,
              title: item.customCake.decoration.title,
              description: item.customCake.decoration.description,
              decorationUrl: item.customCake.decoration.decorationUrl,
              createdAt: item.customCake.decoration.createdAt,
              updatedAt: item.customCake.decoration.updatedAt,
            },
            shape: item.customCake.shape,
            message: item.customCake.message,
            imageToPrint: item.customCake.imageToPrint,
            snapshotFront: item.customCake.snapshotFront,
            snapshotTop: item.customCake.snapshotTop,
            snapshotSliced: item.customCake.snapshotSliced,
          },
          price: parseFloat(item.price ?? '0'),
          id: item.id,
          orderId: item.orderId,
          quantity: item.quantity ?? 0,
          size: item.size ?? '',
          flavor: item.flavor ?? '',
          selectedOptions: [],
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      } else if (item.predesignedCakeId) {
        const pdc = await this.cartService.getPredesignedCake(item.predesignedCakeId, regionId);
        predesignedCakeItems.push({
          data: {
            id: pdc.id,
            name: pdc.name,
            description: pdc.description,
            tagId: pdc.tagId || '',
            tagName: pdc.tagName || '',
            isActive: pdc.isActive,
            configs: pdc.configs.map((config) => ({
              id: config.id,
              predesignedCakeId: config.id || '',
              shape: {
                id: config.shape.id,
                title: config.shape.title,
                description: config.shape.description,
                shapeUrl: config.shape.shapeUrl,
                createdAt: config.shape.createdAt,
                updatedAt: config.shape.updatedAt,
              },
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
                createdAt: config.decoration.createdAt,
                updatedAt: config.decoration.updatedAt,
              },
              frostColorValue: config.frostColorValue,
              createdAt: config.createdAt,
              updatedAt: config.updatedAt,
            })),
            price: item.price ?? '0',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          price: parseFloat(item.price ?? '0'),
          id: item.id,
          orderId: item.orderId,
          quantity: item.quantity ?? 0,
          size: item.size ?? '',
          flavor: item.flavor ?? '',
          selectedOptions: [],
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      } else if (item.featuredCakeId) {
        const fc = await this.cartService.getFeaturedCake(item.featuredCakeId, regionId);
        featuredCakeItems.push({
          data: {
            id: fc.id,
            name: fc.name,
            description: fc.description,
            images: fc.images,
            capacity: fc.capacity,
            flavorList: fc.flavorList,
            pipingPaletteList: fc.pipingPaletteList,
            tagName: fc.tagName || '',
            isActive: fc.isActive,
            price: item.price ?? '0',
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
          },
          price: parseFloat(item.price ?? '0'),
          id: item.id,
          orderId: item.orderId,
          quantity: item.quantity ?? 0,
          size: item.size ?? '',
          flavor: item.flavor ?? '',
          selectedOptions: [],
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      } else if (item.addonId) {
        const addon = await this.cartService.getAddon(item.addonId, regionId);
        addonItems.push({
          data: {
            id: addon.id,
            name: addon.name,
            description: addon.description || '',
            category: addon.category as string,
            images: addon.images,
            tagId: addon.tagId || '',
            options: [],
            tagName: addon.tagName || '',
            isActive: addon.isActive,
            price: item.price ?? '0',
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          },
          price: parseFloat(item.price ?? '0'),
          id: item.id,
          orderId: item.orderId,
          quantity: item.quantity ?? 0,
          size: item.size ?? '',
          flavor: item.flavor ?? '',
          selectedOptions: item.selectedOptions || [],
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      } else if (item.sweetId) {
        const sweet = await this.cartService.getSweet(item.sweetId, regionId);
        sweetItems.push({
          data: {
            id: sweet.id,
            name: sweet.name,
            description: sweet.description || '',
            images: sweet.images,
            tagId: sweet.tagId || '',
            tagName: sweet.tagName || '',
            isActive: sweet.isActive,
            sizes: sweet.sizes,
            price: item.price ?? '0',
            createdAt: sweet.createdAt,
            updatedAt: sweet.updatedAt,
          },
          price: parseFloat(item.price ?? '0'),
          id: item.id,
          orderId: item.orderId,
          quantity: item.quantity ?? 0,
          size: item.size ?? '',
          flavor: item.flavor ?? '',
          selectedOptions: [],
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        });
      }
    }

    return {
      customCakeItems,
      predesignedCakeItems,
      featuredCakeItems,
      addonItems,
      sweetItems,
    };
  }
}
