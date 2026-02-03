import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateOrderDto, OrderItemDto, OrderResponseDto } from '../dto';
import { db } from '@/db';
import {
  orders,
  locations,
  paymentMethods,
  cakes,
  addons,
  orderItems,
  orderStatusEnum,
} from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { BAKERY_DEFAULTS } from '@/constants/global.constants';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  async create(
    userId: string,
    orderData: CreateOrderDto,
  ): Promise<SuccessResponse<OrderResponseDto>> {
    const {
      items,
      locationId,
      paymentMethodId,
      cardMessage = '',
      deliveryNote = '',
      keepAnonymous = false,
      discountAmount = 0,
      cardQrCodeUrl = '',
    } = orderData;

    const [existingLocation] = await db
      .select()
      .from(locations)
      .where(and(eq(locations.id, locationId), eq(locations.userId, userId)))
      .limit(1);
    if (!existingLocation) {
      this.logger.warn(
        `Order creation failed: Invalid location ID ${locationId} for user ${userId}`,
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

    let totalPrice = 0;
    const orderItemsDetails: (OrderItemDto & { price: string })[] = [];
    let finalPrice = 0;
    const willDeliverAt = this.calculateTheExpectedDeliveryTime();

    // loop through items
    // calculate total price of each item
    try {
      for (const item of items) {
        const [cake] = await db
          .select({ cakePrice: cakes.mainPrice })
          .from(cakes)
          .where(eq(cakes.id, item.cakeId));

        const [addon] = await db
          .select({ addonPrice: addons.price })
          .from(addons)
          .where(eq(addons.id, item.addonId));

        const optionsPrice = item.selectedOptions.reduce(
          (acc, option) => acc + Number(option.value),
          0,
        );

        const itemTotalPrice =
          item.quantity * (Number(cake.cakePrice) + Number(addon.addonPrice) + optionsPrice);

        totalPrice += itemTotalPrice;

        orderItemsDetails.push({
          cakeId: item.cakeId,
          addonId: item.addonId,
          quantity: item.quantity,
          flavor: item.flavor,
          size: item.size,
          price: itemTotalPrice.toString(),
          selectedOptions: item.selectedOptions,
        });
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`OrderItems creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create orderItems',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }

    finalPrice = totalPrice - discountAmount;

    try {
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
            totalPrice: totalPrice.toString(),
            finalPrice: finalPrice.toString(),
            discountAmount: discountAmount.toString(),
            willDeliverAt,
          })
          .returning();

        const itemsToInsert = orderItemsDetails.map((item) => ({
          ...item,
          orderId: createdOrder.id,
        }));

        const newItems = await tx.insert(orderItems).values(itemsToInsert).returning();

        return { newOrder: createdOrder, newItems };
      });

      this.logger.log(`
        Order created: ${newOrder.id} for user ${userId}, with ${newItems.length} items`);

      const response: OrderResponseDto = {
        id: newOrder.id,
        discountAmount: newOrder.discountAmount,
        totalPrice: newOrder.totalPrice,
        finalPrice: newOrder.finalPrice,
        orderStatus: newOrder.orderStatus,
        willDeliverAt: newOrder.willDeliverAt,
        createdAt: newOrder.createdAt,
        items: newItems,
      };

      return successResponse(response, 'Order created successfully', HttpStatus.CREATED);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Order creation error: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to create order',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private calculateTheExpectedDeliveryTime(): Date {
    const currentHour = new Date().getHours();

    const isWorkingHours =
      currentHour >= BAKERY_DEFAULTS.BAKERY_OPEN_HOUR &&
      currentHour < BAKERY_DEFAULTS.BAKERY_CLOSE_HOUR;

    const deliveryDate = new Date();

    if (isWorkingHours) {
      // inside working hours -> tomorrow (+1)
      deliveryDate.setDate(deliveryDate.getDate() + 1);
    } else {
      // outside working hours -> day after tomorrow (+2)
      deliveryDate.setDate(deliveryDate.getDate() + 2);
    }

    deliveryDate.setHours(BAKERY_DEFAULTS.BAKERY_OPEN_HOUR, 0, 0, 0);

    return deliveryDate;
  }

  async getOrdersForUser(userId: string): Promise<SuccessResponse<OrderResponseDto[]>> {
    this.logger.debug(`Fetching orders for user: ${userId}`);
    const userOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
      with: {
        orderItems: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    if (!userOrders.length) {
      this.logger.warn(`No orders found for user: ${userId}`);
      return successResponse([], 'No orders found for this user', HttpStatus.OK);
    }

    const response: OrderResponseDto[] = userOrders.map((order) => ({
      ...order,
      items: order.orderItems,
    }));

    this.logger.log(`Retrieved ${response.length} orders for user: ${userId}`);
    return successResponse(response, 'Orders retrieved successfully');
  }

  async getOrderById(orderId: string, userId: string): Promise<SuccessResponse<OrderResponseDto>> {
    this.logger.debug(`Fetching order by id: ${orderId}`);

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

    if (!order) {
      this.logger.warn(`Order with id: ${orderId} not found`);
      throw new NotFoundException(
        errorResponse('Order not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (order.userId !== userId) {
      this.logger.warn(`User ${userId} is not authorized to access order ${orderId}`);
      throw new ForbiddenException(
        errorResponse(
          'You are not authorized to access this order',
          HttpStatus.FORBIDDEN,
          'ForbiddenException',
        ),
      );
    }

    const orderDetails = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        orderItems: true,
      },
    });

    const response: OrderResponseDto = {
      ...orderDetails,
      items: orderDetails.orderItems,
    };

    this.logger.log(`Retrieved order: ${orderId}`);
    return successResponse(response, 'Order retrieved successfully');
  }

  async getAllOrders(): Promise<SuccessResponse<OrderResponseDto[]>> {
    this.logger.debug('Fetching all orders');
    const allOrders = await db.query.orders.findMany({
      with: {
        orderItems: true,
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });

    const response: OrderResponseDto[] = allOrders.map((order) => ({
      ...order,
      items: order.orderItems,
    }));

    this.logger.log(`Retrieved ${response.length} orders`);
    return successResponse(response, 'All orders retrieved successfully');
  }

  async cancelOrder(
    orderId: string,
    userId: string,
  ): Promise<SuccessResponse<{ id: string; status: string }>> {
    this.logger.debug(`Cancelling order: ${orderId} for user: ${userId}`);
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
    return successResponse(updatedOrder, 'Order cancelled successfully');
  }

  async refuseOrder(orderId: string): Promise<SuccessResponse<{ id: string; status: string }>> {
    this.logger.debug(`Refusing order: ${orderId}`);
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
    return successResponse(updatedOrder, 'Order refused successfully');
  }

  async changeOrderStatus(
    orderId: string,
    status: (typeof orderStatusEnum.enumValues)[number],
  ): Promise<SuccessResponse<{ id: string; status: string }>> {
    this.logger.debug(`Changing status of order: ${orderId} to ${status}`);
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
    return successResponse(updatedOrder, 'Order status updated successfully');
  }
}
