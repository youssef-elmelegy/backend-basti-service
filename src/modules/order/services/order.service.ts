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
  OrderItemOptionDto,
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
  regionItemPrices,
  designedCakeConfigs,
  cartItems,
  bakeries,
  users,
  featuredCakes,
  shapes,
  regions,
} from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { errorResponse } from '@/utils';
import { randomBytes } from 'crypto';

import { CartService } from '@/modules/cart/services/cart.service';
import { ConfigService } from '@/modules/config/services/config.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(OrderService.name);

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

      for (const addon of addonsItems) {
        const addonPrice = await this.caclulateAddonPrice(
          addon.addonId,
          regionId,
          'selectedOptions' in addon ? addon.selectedOptions : undefined,
        );
        totalPrice += addonPrice * addon.quantity;
        orderItemsDetails.push({
          price: addonPrice.toFixed(2),
          quantity: addon.quantity,
          addonId: addon.addonId,
          selectedOptions: 'selectedOptions' in addon ? addon.selectedOptions : undefined,
        });
      }

      for (const sweet of sweetsItems) {
        const sweetPrice = await this.caclulateSweetPrice(sweet.sweetId, regionId);
        totalPrice += sweetPrice * sweet.quantity;
        orderItemsDetails.push({
          price: sweetPrice.toFixed(2),
          quantity: sweet.quantity,
          sweetId: sweet.sweetId,
        });
      }

      for (const featuredCake of featuredCakesItems) {
        const featuredCakePrice = await this.caclulateFeaturedCakePrice(
          featuredCake.featuredCakeId,
          regionId,
        );

        const [res] = await db
          .select({ capacity: featuredCakes.capacity })
          .from(featuredCakes)
          .where(eq(featuredCakes.id, featuredCake.featuredCakeId))
          .limit(1);

        totalCapacity += res.capacity * featuredCake.quantity;

        totalPrice += featuredCakePrice * featuredCake.quantity;
        orderItemsDetails.push({
          price: featuredCakePrice.toFixed(2),
          quantity: featuredCake.quantity,
          featuredCakeId: featuredCake.featuredCakeId,
        });
      }

      for (const predesignedCake of predesignedCakesItems) {
        const predesignedCakePrice = await this.caclulatePredesignedCakePrice(
          predesignedCake.predesignedCakeId,
          regionId,
        );
        totalPrice += predesignedCakePrice * predesignedCake.quantity;

        const [res] = await db
          .select({ capacity: shapes.capacity })
          .from(designedCakeConfigs)
          .innerJoin(shapes, eq(shapes.id, designedCakeConfigs.shapeId))
          .where(eq(designedCakeConfigs.predesignedCakeId, predesignedCake.predesignedCakeId))
          .limit(1);

        if (res.capacity) {
          totalCapacity += res.capacity * predesignedCake.quantity;
        }

        orderItemsDetails.push({
          price: predesignedCakePrice.toFixed(2),
          quantity: predesignedCake.quantity,
          predesignedCakeId: predesignedCake.predesignedCakeId,
        });
      }

      for (const customCake of customCakesItems) {
        const customCakeData =
          'customCake' in customCake ? customCake.customCake : customCake.customCakeConfig;

        if (!customCakeData) continue;

        const customCakePrice = await this.caclulateCustomCakePrice(customCakeData, regionId);
        totalPrice += customCakePrice * customCake.quantity;

        const [res] = await db
          .select({ capacity: shapes.capacity })
          .from(shapes)
          .where(eq(shapes.id, customCakeData.shapeId))
          .limit(1);

        if (res?.capacity) {
          totalCapacity += res.capacity * customCake.quantity;
        }

        orderItemsDetails.push({
          price: customCakePrice.toFixed(2),
          quantity: customCake.quantity,
          customCake: customCakeData,
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
        orderStatus: null,
        items: newItems.map((item) => ({
          id: item.id,
          orderId: item.orderId,
          addonId: item.addonId,
          sweetId: item.sweetId,
          featuredCakeId: item.featuredCakeId,
          predesignedCakeId: item.predesignedCakeId,
          customCake: item.customCake
            ? {
                ...item.customCake,
                extraLayers: item.customCake?.extraLayers || [],
              }
            : null,
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
      // Re-throw known exceptions
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

      // Process all orders concurrently with per-order fallback
      const response = await Promise.all(
        allOrders.map(async (order): Promise<OrderResponseDto> => {
          try {
            if (!order.id) {
              throw new Error('Order id is missing');
            }

            return await this.getOrderById(order.id, regionId);
          } catch {
            this.logger.warn(
              `Failed to retrieve full details for order ${order.id}, returning basic order data`,
            );

            return {
              addons: [],
              sweets: [],
              featuredCakes: [],
              predesignedCakes: [],
              customCakes: [],
              ...order,
              totalPrice: parseFloat(order.totalPrice),
              discountAmount: parseFloat(order.discountAmount),
              finalPrice: parseFloat(order.finalPrice),
            };
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

      // Process all bakery orders concurrently with per-order fallback
      const response = await Promise.all(
        bakeryOrders.map(async (order): Promise<OrderResponseDto> => {
          try {
            if (!order.id) {
              throw new Error('Order id is missing');
            }

            return await this.getOrderById(order.id, regionId);
          } catch {
            this.logger.warn(
              `Failed to retrieve full details for order ${order.id}, returning basic order data`,
            );

            await this.confirmAssignedOrder(order);

            return {
              addons: [],
              sweets: [],
              featuredCakes: [],
              predesignedCakes: [],
              customCakes: [],
              ...order,
              totalPrice: parseFloat(order.totalPrice),
              discountAmount: parseFloat(order.discountAmount),
              finalPrice: parseFloat(order.finalPrice),
            };
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

  async getOrderById(orderId: string, regionId: string): Promise<OrderResponseDto> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

      this.logger.log(`Fetching order details for order ID: ${orderId} with ${items.length} items`);

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
        this.logger.log(`Processing item with ID: ${item.id} for order ID: ${orderId}`);
        this.logger.log(`items list: ${JSON.stringify(items)}`);
        if (item.customCake) {
          this.logger.log(
            `Fetching custom cake components for item ID: ${item.id} in order ID: ${orderId}`,
          );
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
        this.logger.log(`Processed item with ID: ${item.id} for order ID: ${orderId}`);
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

    try {
      const [updatedOrder] = await db
        .update(orders)
        .set({
          bakeryId: bakeryId,
          assigningDate: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, bakeryId: orders.bakeryId });

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
      const [updatedOrder] = await db
        .update(orders)
        .set({
          bakeryId: null,
          assigningDate: null,
          orderStatus: 'pending',
        })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, bakeryId: orders.bakeryId });

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

  private calculateSelectedOptionsPrice(selectedOptions?: OrderItemOptionDto[]): number {
    if (!selectedOptions?.length) {
      return 0;
    }

    return selectedOptions.reduce((total, option) => {
      const normalizedValue = option.value.replace(',', '.').trim();
      const parsedValue = Number.parseFloat(normalizedValue);

      return Number.isFinite(parsedValue) ? total + parsedValue : total;
    }, 0);
  }

  private async caclulateAddonPrice(
    addonId: string,
    regionId: string,
    selectedOptions?: OrderItemOptionDto[],
  ): Promise<number> {
    const [result] = await db
      .select({ price: regionItemPrices.price })
      .from(regionItemPrices)
      .where(and(eq(regionItemPrices.addonId, addonId), eq(regionItemPrices.regionId, regionId)))
      .limit(1);

    const basePrice = result?.price ? Number.parseFloat(result.price) : 0;
    const selectedOptionsPrice = this.calculateSelectedOptionsPrice(selectedOptions);

    return basePrice + selectedOptionsPrice;
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
    const flavorPrices = alias(regionItemPrices, 'flavorPrices');
    const decorationPrices = alias(regionItemPrices, 'decorationPrices');
    const shapePrices = alias(regionItemPrices, 'shapePrices');

    // Get all configs for this predesigned cake with their component prices
    const configs = await db
      .select({
        flavorPrice: flavorPrices.price,
        decorationPrice: decorationPrices.price,
        shapePrice: shapePrices.price,
      })
      .from(designedCakeConfigs)
      .leftJoin(
        flavorPrices,
        and(
          eq(flavorPrices.flavorId, designedCakeConfigs.flavorId),
          eq(flavorPrices.regionId, regionId),
        ),
      )
      .leftJoin(
        decorationPrices,
        and(
          eq(decorationPrices.decorationId, designedCakeConfigs.decorationId),
          eq(decorationPrices.regionId, regionId),
        ),
      )
      .leftJoin(
        shapePrices,
        and(
          eq(shapePrices.shapeId, designedCakeConfigs.shapeId),
          eq(shapePrices.regionId, regionId),
        ),
      )
      .where(eq(designedCakeConfigs.predesignedCakeId, predesignedCakeId));

    if (configs.length === 0) {
      throw new NotFoundException(
        errorResponse(
          `No configs found for predesigned cake ${predesignedCakeId}`,
          HttpStatus.NOT_FOUND,
          'NotFoundException',
        ),
      );
    }

    // Sum up all component prices from all configs
    let total = 0;
    for (const config of configs) {
      total += parseFloat(config.flavorPrice || '0');
      total += parseFloat(config.decorationPrice || '0');
      total += parseFloat(config.shapePrice || '0');
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
}
