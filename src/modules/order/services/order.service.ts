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
  users,
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

  async create(orderData: CreateOrderDto): Promise<CreateOrderResponseDto> {
    const {
      userId,
      userData,
      locationId,
      locationData,
      paymentMethodId,
      PaymentMethodData,
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
      let user: typeof users.$inferInsert;
      let existingLocation: typeof locations.$inferInsert;
      let existingPaymentMethod: typeof paymentMethods.$inferInsert;
      let cart: (typeof cartItems.$inferSelect)[];

      if (!userId && !userData) {
        this.logger.warn(`User ID or user data must be provided to place an order`);
        throw new BadRequestException(
          errorResponse(
            'User ID or user data must be provided',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
          ),
        );
      }

      if (userId) {
        user = await db.select().from(users).where(eq(users.id, userId)).limit(1)[0];
      }

      // if (!locationId && !locationData) {
      //   this.logger.warn(`Location ID or location data must be provided to place an order`);
      //   throw new BadRequestException(
      //     errorResponse(
      //       'Location ID or location data must be provided',
      //       HttpStatus.BAD_REQUEST,
      //       'BadRequestException',
      //     ),
      //   );
      // }

      if (userId && locationId) {
        existingLocation = await db
          .select()
          .from(locations)
          .where(and(eq(locations.id, locationId), eq(locations.userId, userId)))
          .limit(1)[0];

        if (!existingLocation) {
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
      }

      if (userId && paymentMethodId) {
        existingPaymentMethod = await db
          .select()
          .from(paymentMethods)
          .where(and(eq(paymentMethods.id, paymentMethodId), eq(paymentMethods.userId, userId)))
          .limit(1)[0];

        if (!existingPaymentMethod) {
          this.logger.warn(
            `Payment method ID ${locationId} is invalid or does not belong to the user ${userId}`,
          );
          throw new BadRequestException(
            errorResponse(
              'Invalid Payment method ID or location does not belong to the user',
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
            ),
          );
        }
      }

      if (userId && (!orderItemsData || orderItemsData.length === 0)) {
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

      // Initialize cart as empty array if undefined
      const cartItems$ = cart || [];

      const addons = useOrderItemsData
        ? orderItemsData.filter((item) => item.addonId)
        : cartItems$.filter((item) => item.addonId);
      const sweets = useOrderItemsData
        ? orderItemsData.filter((item) => item.sweetId)
        : cartItems$.filter((item) => item.sweetId);
      const featuredCakes = useOrderItemsData
        ? orderItemsData.filter((item) => item.featuredCakeId)
        : cartItems$.filter((item) => item.featuredCakeId);
      const predesignedCakes = useOrderItemsData
        ? orderItemsData.filter((item) => item.predesignedCakeId)
        : cartItems$.filter((item) => item.predesignedCakeId);
      const customCakes = useOrderItemsData
        ? orderItemsData.filter((item) => item.customCakeConfig)
        : cartItems$.filter((item) => item.customCake);

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
        const customCakeData =
          'customCake' in customCake ? customCake.customCake : customCake.customCakeConfig;

        if (!customCakeData) continue;

        const customCakePrice = await this.caclulateCustomCakePrice(customCakeData, regionId);
        totalPrice += customCakePrice * customCake.quantity;
        orderItemsDetails.push({
          price: customCakePrice.toFixed(2),
          quantity: customCake.quantity,
          customCake: customCakeData,
        });
      }

      let finalPrice = 0;
      const willDeliverAt = await this.calculateTheExpectedDeliveryTime(type, wantedDeliveryDate);

      finalPrice = totalPrice - discountAmount;

      const { newOrder, newItems } = await db.transaction(async (tx) => {
        const [createdOrder] = await tx
          .insert(orders)
          .values({
            userId,
            userData: {
              email: userData?.email || user?.email || '',
              firstName: userData?.firstName || user?.firstName || '',
              lastName: userData?.lastName || user?.lastName || '',
              phoneNumber: userData?.phoneNumber || user?.phoneNumber || '',
            },
            locationId,
            locationData: {
              label: locationData?.label || existingLocation?.label || '',
              buildingNo: locationData?.buildingNo || existingLocation?.buildingNo || '',
              street: locationData?.street || existingLocation?.street || '',
              description: locationData?.description || existingLocation?.description || '',
              latitude: Number(locationData?.latitude || existingLocation?.latitude || 0),
              longitude: Number(locationData?.longitude || existingLocation?.longitude || 0),
            },
            paymentMethodId,
            paymentMethodType: PaymentMethodData?.type || existingPaymentMethod?.type || 'cash',
            paymentData: existingPaymentMethod
              ? {
                  type: existingPaymentMethod.type,
                  cardHolderName:
                    PaymentMethodData?.cardHolderName || existingPaymentMethod.cardHolderName || '',
                  cardLastFourDigits:
                    PaymentMethodData?.cardLastFourDigits ||
                    existingPaymentMethod.cardLastFourDigits ||
                    '',
                  cardExpiryMonth: Number(
                    PaymentMethodData?.cardExpiryMonth ||
                      existingPaymentMethod.cardExpiryMonth ||
                      0,
                  ),
                  cardExpiryYear: Number(
                    PaymentMethodData?.cardExpiryYear || existingPaymentMethod.cardExpiryYear || 0,
                  ),
                }
              : undefined,
            cardMessage,
            deliveryNote,
            keepAnonymous,
            recipientData,
            wantedDeliveryDate: wantedDeliveryDate ? new Date(wantedDeliveryDate) : undefined,
            wantedDeliveryTimeSlot,
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
        ...newOrder,
        totalPrice: parseFloat(newOrder.totalPrice),
        discountAmount: parseFloat(newOrder.discountAmount),
        finalPrice: parseFloat(newOrder.finalPrice),
        items: newItems,
      };

      return response;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException) {
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
    wantedDate?: string,
  ): Promise<Date> {
    const config = await this.configService.get();

    const currentHour = new Date().getHours();
    const isWorkingHours = currentHour >= config.openingHour && currentHour < config.closingHour;

    const baseDays = type === 'big_cakes' ? 2 : 1;

    //?> Calculate minimum delivery date based on preparation time
    const minDeliveryDate = new Date();
    let daysToAdd = isWorkingHours ? baseDays : baseDays + 1;

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
