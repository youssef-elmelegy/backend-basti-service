import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
  NotFoundException,
  HttpException,
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
  AvailableBakeryDto,
  FinalizeOrderDto,
  FinalizeOrderResponseDto,
  GetOrdersFinancialsDto,
  GetOrdersFinancialsResponseDto,
  GetUnassignedOrdersQueryDto,
  GetAssignedOrdersQueryDto,
  GetCompletedOrdersQueryDto,
  GetDispatchOrdersQueryDto,
  AssignDriverDto,
  VerifyDeliveryCodeDto,
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
  admins,
  appConfig,
  addons,
  sweets,
  featuredCakes,
  bakeryItemStores,
} from '@/db/schema';
import {
  and,
  eq,
  getTableColumns,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  not,
  SQL,
  asc,
  desc,
  isNotNull,
  sql,
} from 'drizzle-orm';
import { PAGINATION_DEFAULTS } from '@/constants/global.constants';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { createHmac, randomBytes, randomInt } from 'crypto';
import { ItemService } from '@/modules/items/item.service';
import { StockService } from './stock.service';
import { SchedulerService } from './scheduler.service';
import { TranslationService } from '@/common';
import { CouponService } from '@/modules/coupon/services/coupon.service';
import { NotificationService } from '@/modules/notification/services/notification.service';
import { env } from '@/env';

/** A stockable order item the target bakery can't fully reserve when reassigning. */
export interface BakeryStockIssue {
  name: string;
  reason: 'not_stocked' | 'insufficient';
  requested: number;
  available: number;
}

/* eslint-disable */
@Injectable()
export class OrderService {
  constructor(
    private readonly itemService: ItemService,
    private readonly stockService: StockService,
    private readonly schedulerService: SchedulerService,
    private readonly translationService: TranslationService,
    private readonly couponservice: CouponService,
    private readonly notificationService: NotificationService,
  ) {}

  private readonly logger = new Logger(OrderService.name);

  private getAddonQuantityKey(addonId: string, optionId?: string): string {
    return `${addonId}::${optionId ?? ''}`;
  }

  private generateDeliveryCodeValue(): string {
    return randomInt(100000, 1000000).toString();
  }

  private hashDeliveryCheckCode(code: string): string {
    return createHmac('sha256', env.JWT_ACCESS_SECRET).update(code).digest('hex');
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

      const [region] = await db
        .select({
          ...getTableColumns(regions),
          name: this.translationService.getLocalized(regions.name, 'name'),
        })
        .from(regions)
        .where(eq(regions.id, regionId))
        .limit(1);

      if (!region) {
        this.logger.warn(`Region with id ${regionId} not found`);
        throw new BadRequestException(
          errorResponse('routes.regions.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
        );
      }

      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

      if (!user) {
        this.logger.warn(`User not found`);
        throw new BadRequestException(
          errorResponse('routes.users.not_found', HttpStatus.BAD_REQUEST, 'BadRequestException'),
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
              'routes.orders.invalid_location',
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
              'routes.orders.invalid_payment_method',
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
              `routes.cart.orders.cart_empty`,
              HttpStatus.BAD_REQUEST,
              'BadRequestException',
              { userId, type },
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
      let requiredMinPrepHours = 0;

      const quantityCash: Record<string, number> = {};

      // addons processing
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

      // sweets processing
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

      // featured cakes processing
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
        requiredMinPrepHours = Math.max(requiredMinPrepHours, featuredCake.minPrepHours ?? 0);
        orderItemsDetails.push({
          featuredCake: featuredCake,
          price: featuredCake.price ?? '0',
          quantity: qnt,
          selectedOptions: [],
        });
      }

      // predesigned cakes processing
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
        requiredMinPrepHours = Math.max(
          requiredMinPrepHours,
          predesignedCake.totalMinPrepHours ?? 0,
        );
        orderItemsDetails.push({
          predesignedCake: predesignedCake,
          price: predesignedCake.price ?? '0',
          quantity: qnt,
          selectedOptions: [],
        });
      }

      // custom cakes processing
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
        requiredMinPrepHours = Math.max(requiredMinPrepHours, customCake.totalMinPrepHours ?? 0);
        orderItemsDetails.push({
          customCake: customCake,
          price: customCake.price ?? '0',
          quantity: qnt,
          selectedOptions: [],
        });
      }

      let finalPrice = 0;
      const willDeliverAt = await this.schedulerService.calculateTheExpectedDeliveryTime(
        type,
        wantedDeliveryDate,
        requiredMinPrepHours,
        totalCapacity,
      );

      finalPrice = totalPrice - discountAmount;

      // Snapshot pricing config at order time so financial reports reflect the
      // config that was in effect when the order was placed, not the column defaults.
      // Note: config stores bastiPercentage as 0-100 while the order column (and the
      // financials calc) expect a 0-1 fraction, so we divide by 100 here.
      const [liveConfig] = await db.select().from(appConfig).limit(1);

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
            cardMessage,
            deliveryNote,
            keepAnonymous,
            recipientData,
            wantedDeliveryDate: wantedDeliveryDate ? new Date(wantedDeliveryDate) : undefined,
            wantedDeliveryTimeSlot: wantedDeliveryTimeSlot,
            totalPrice: totalPrice.toFixed(2),
            finalPrice: finalPrice.toFixed(2),
            discountAmount: discountAmount.toFixed(2),
            ...(liveConfig && {
              bastiPercentage: (parseFloat(liveConfig.bastiPercentage) / 100).toFixed(2),
              deliveryAmount: liveConfig.deliveryAmount,
              bastiDeliveryAmount: liveConfig.bastiDeliveryAmount,
            }),
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
            errorResponse(
              'routes.cart.orders.cart_empty_for_user',
              HttpStatus.BAD_REQUEST,
              'BadRequest',
              { userId, type },
            ),
          );
        }

        const newItems = await tx.insert(orderItems).values(itemsToInsert).returning();

        return { newOrder: createdOrder, newItems };
      });

      this.logger.log(
        `Order created: ${newOrder.id} for user ${userId}, with ${newItems.length} items`,
      );

      await this.notificationService.pushToPlatformAdmins({
        title: 'New order placed',
        body: `Order ${newOrder.referenceNumber} was placed by ${user.firstName ?? 'a customer'}.`,
        type: 'new_order',
        redirectId: newOrder.id,
        data: { orderId: newOrder.id, referenceNumber: newOrder.referenceNumber ?? '' },
      });

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
          `routes.orders.failed_place`,
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
          { error: errMsg },
        ),
      );
    }
  }

  async getAllForUser(userId: string, regionId?: string): Promise<OrderResponseDto[]> {
    try {
      const ordersForUser = await db.select().from(orders).where(eq(orders.userId, userId));

      const validOrderIds = ordersForUser
        .map((order) => order.id)
        .filter((orderId): orderId is string => Boolean(orderId));

      const response = await Promise.all(
        validOrderIds.map((orderId) => this.getOneForUser(orderId, userId, regionId)),
      );

      this.logger.log(`Retrieved ${response.length} orders for user ${userId}`);
      return response;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to retrieve orders for user ${userId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getOneForUser(
    orderId: string,
    userId: string,
    regionId?: string,
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
          errorResponse('routes.orders.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
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
        ...this.exposeOrderFields(order, 'user'),
        bakeryId: order.bakeryId || undefined,
        totalCapacity: order.totalCapacity || 0,
        deliveryNote: order.deliveryNote || '',
        totalPrice: parseFloat(order.totalPrice),
        discountAmount: parseFloat(order.discountAmount),
        finalPrice: parseFloat(order.finalPrice),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to retrieve order ${orderId} for user ${userId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_retrieve',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getAll(regionId?: string, status?: string[]): Promise<OrderResponseDto[]> {
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
          'routes.orders.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Paginated feed of a bakery's orders. Same shape as the admin endpoints:
   * { items, pagination: { total, totalPages, page, limit } }.
   * Filters: regionId, q (reference search), status[], sort.
   */
  async getAllForBakery(
    bakeryId: string,
    query: {
      page?: number;
      limit?: number;
      regionId?: string;
      type?: string;
      status?: string[];
      q?: string;
      sort?: 'asc' | 'desc';
    } = {},
  ): Promise<{
    items: OrderResponseDto[];
    pagination: { total: number; totalPages: number; page: number; limit: number };
  }> {
    const page = query.page ?? PAGINATION_DEFAULTS.PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULTS.LIMIT;
    const sortDir = query.sort ?? 'desc';
    const offset = (page - 1) * limit;

    try {
      // Verify bakery exists
      const [bakery] = await db.select().from(bakeries).where(eq(bakeries.id, bakeryId)).limit(1);

      if (!bakery) {
        this.logger.warn(`Bakery with id: ${bakeryId} not found`);
        throw new NotFoundException(
          errorResponse('routes.bakery.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const conditions: SQL[] = [eq(orders.bakeryId, bakeryId)];
      if (query.regionId) {
        conditions.push(eq(orders.regionId, query.regionId));
      }
      if (query.type) {
        conditions.push(
          eq(orders.cartType, query.type as (typeof orders.cartType.enumValues)[number]),
        );
      }
      if (query.status && query.status.length > 0) {
        conditions.push(
          inArray(
            orders.orderStatus,
            query.status as (typeof orders.orderStatus.enumValues)[number][],
          ),
        );
      }
      if (query.q && query.q.trim()) {
        conditions.push(ilike(orders.referenceNumber, `%${query.q.trim()}%`));
      }

      const where = and(...conditions);

      const [{ count }] = await db
        .select({ count: sql<string>`COUNT(*)` })
        .from(orders)
        .where(where);
      const total = typeof count === 'string' ? parseInt(count, 10) : count;

      const pageRows = await db
        .select()
        .from(orders)
        .where(where)
        .orderBy(sortDir === 'asc' ? asc(orders.createdAt) : desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      const orderIds = pageRows
        .map((order) => order.id)
        .filter((orderId): orderId is string => Boolean(orderId));

      const allOrderItems =
        orderIds.length > 0
          ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
          : [];

      const groupedItems = this.groupOrderItemsByOrderId(allOrderItems);

      const items = await Promise.all(
        pageRows.map(async (order): Promise<OrderResponseDto> => {
          try {
            if (!order.id) {
              throw new Error('Order id is missing');
            }
            const formattedItems = await this.formatOrderItemsResponse(
              groupedItems[order.id] || [],
              query.regionId ?? order.regionId,
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

      this.logger.log(
        `Bakery ${bakeryId} orders page ${page}/${Math.max(1, Math.ceil(total / limit))} (total ${total})`,
      );

      return {
        items,
        pagination: {
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          page,
          limit,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve bakery orders for bakery ${bakeryId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Paginated feed of unassigned active orders for the admin sidebar.
   * Excludes delivered/cancelled. Filters apply at the SQL layer so we don't
   * scan the whole orders table for every keystroke.
   */
  async getUnassigned(query: GetUnassignedOrdersQueryDto): Promise<{
    items: OrderResponseDto[];
    pagination: { total: number; totalPages: number; page: number; limit: number };
  }> {
    const page = query.page ?? PAGINATION_DEFAULTS.PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULTS.LIMIT;
    const sortDir = query.sort ?? 'desc';
    const offset = (page - 1) * limit;

    // Default statuses for an "unassigned" view: everything that's still in flight.
    const defaultActiveStatuses = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
    ];
    const statusList =
      query.status && query.status.length > 0 ? query.status : defaultActiveStatuses;

    try {
      const conditions: SQL[] = [
        isNull(orders.bakeryId),
        not(eq(orders.orderStatus, 'delivered')),
        not(eq(orders.orderStatus, 'cancelled')),
        inArray(orders.orderStatus, statusList as (typeof orders.orderStatus.enumValues)[number][]),
      ];

      if (query.regionId) {
        conditions.push(eq(orders.regionId, query.regionId));
      }
      if (query.type) {
        conditions.push(
          eq(orders.cartType, query.type as (typeof orders.cartType.enumValues)[number]),
        );
      }
      if (query.q && query.q.trim()) {
        conditions.push(ilike(orders.referenceNumber, `%${query.q.trim()}%`));
      }

      const where = and(...conditions);

      const [{ count }] = await db
        .select({ count: sql<string>`COUNT(*)` })
        .from(orders)
        .where(where);
      const total = typeof count === 'string' ? parseInt(count, 10) : count;

      const pageRows = await db
        .select()
        .from(orders)
        .where(where)
        .orderBy(sortDir === 'asc' ? asc(orders.createdAt) : desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      const orderIds = pageRows
        .map((order) => order.id)
        .filter((orderId): orderId is string => Boolean(orderId));

      const pageItems =
        orderIds.length > 0
          ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
          : [];
      const groupedItems = this.groupOrderItemsByOrderId(pageItems);

      const items = await Promise.all(
        pageRows.map(async (order): Promise<OrderResponseDto> => {
          try {
            if (!order.id) throw new Error('Order id is missing');
            const formattedItems = await this.formatOrderItemsResponse(
              groupedItems[order.id] || [],
              query.regionId ?? order.regionId,
            );
            return this.buildOrderResponse(order, formattedItems);
          } catch {
            this.logger.warn(
              `Failed to retrieve full details for order ${order.id}, returning basic data`,
            );
            return this.buildBasicOrderResponse(order);
          }
        }),
      );

      this.logger.log(
        `Unassigned orders page ${page}/${Math.max(1, Math.ceil(total / limit))} (total ${total})`,
      );

      return {
        items,
        pagination: {
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          page,
          limit,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve unassigned orders: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Orders that have been assigned to a bakery, grouped by bakeryId.
   * Used by the admin Kanban view. Not paginated — usually a manageable count.
   *
   * By default only active (non-terminal) orders are returned. To pull history,
   * pass explicit statuses (e.g. status=delivered,cancelled) — terminal statuses
   * are no longer hard-excluded, so the status filter fully controls the scope.
   */
  async getAssigned(query: GetAssignedOrdersQueryDto): Promise<Record<string, OrderResponseDto[]>> {
    const sortDir = query.sort ?? 'desc';
    const defaultActiveStatuses = [
      'pending',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
    ];
    const statusList =
      query.status && query.status.length > 0 ? query.status : defaultActiveStatuses;

    try {
      const conditions: SQL[] = [
        isNotNull(orders.bakeryId),
        inArray(orders.orderStatus, statusList as (typeof orders.orderStatus.enumValues)[number][]),
      ];

      if (query.q && query.q.trim()) {
        conditions.push(ilike(orders.referenceNumber, `%${query.q.trim()}%`));
      }

      const allRows = await db
        .select()
        .from(orders)
        .where(and(...conditions))
        .orderBy(sortDir === 'asc' ? asc(orders.createdAt) : desc(orders.createdAt));

      const orderIds = allRows
        .map((order) => order.id)
        .filter((orderId): orderId is string => Boolean(orderId));

      const allItems =
        orderIds.length > 0
          ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
          : [];
      const groupedItems = this.groupOrderItemsByOrderId(allItems);

      const built = await Promise.all(
        allRows.map(async (order): Promise<OrderResponseDto> => {
          try {
            if (!order.id) throw new Error('Order id is missing');
            const formattedItems = await this.formatOrderItemsResponse(
              groupedItems[order.id] || [],
              order.regionId,
            );
            return this.buildOrderResponse(order, formattedItems);
          } catch {
            return this.buildBasicOrderResponse(order);
          }
        }),
      );

      // Group by bakeryId. `bakeryId` is non-null here thanks to the isNotNull filter.
      const result: Record<string, OrderResponseDto[]> = {};
      for (const order of built) {
        const key = order.bakeryId;
        if (!key) continue;
        if (!result[key]) result[key] = [];
        result[key].push(order);
      }

      this.logger.log(
        `Assigned orders: ${built.length} order(s) across ${Object.keys(result).length} bakery(ies)`,
      );

      return result;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve assigned orders: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Paginated feed of completed/terminal orders for the admin completed page.
   * Default statuses: ready / out_for_delivery / delivered / cancelled.
   */
  async getCompleted(query: GetCompletedOrdersQueryDto): Promise<{
    items: OrderResponseDto[];
    pagination: { total: number; totalPages: number; page: number; limit: number };
  }> {
    const page = query.page ?? PAGINATION_DEFAULTS.PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULTS.LIMIT;
    const sortDir = query.sort ?? 'desc';
    const offset = (page - 1) * limit;

    const defaultCompletedStatuses = ['ready', 'out_for_delivery', 'delivered', 'cancelled'];
    const statusList =
      query.status && query.status.length > 0 ? query.status : defaultCompletedStatuses;

    try {
      const conditions: SQL[] = [
        inArray(orders.orderStatus, statusList as (typeof orders.orderStatus.enumValues)[number][]),
      ];

      if (query.regionId) {
        conditions.push(eq(orders.regionId, query.regionId));
      }
      if (query.q && query.q.trim()) {
        conditions.push(ilike(orders.referenceNumber, `%${query.q.trim()}%`));
      }

      const where = and(...conditions);

      const [{ count }] = await db
        .select({ count: sql<string>`COUNT(*)` })
        .from(orders)
        .where(where);
      const total = typeof count === 'string' ? parseInt(count, 10) : count;

      const pageRows = await db
        .select()
        .from(orders)
        .where(where)
        .orderBy(sortDir === 'asc' ? asc(orders.createdAt) : desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      const orderIds = pageRows
        .map((order) => order.id)
        .filter((orderId): orderId is string => Boolean(orderId));

      const pageItems =
        orderIds.length > 0
          ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
          : [];
      const groupedItems = this.groupOrderItemsByOrderId(pageItems);

      const items = await Promise.all(
        pageRows.map(async (order): Promise<OrderResponseDto> => {
          try {
            if (!order.id) throw new Error('Order id is missing');
            const formattedItems = await this.formatOrderItemsResponse(
              groupedItems[order.id] || [],
              query.regionId ?? order.regionId,
            );
            return this.buildOrderResponse(order, formattedItems);
          } catch {
            return this.buildBasicOrderResponse(order);
          }
        }),
      );

      this.logger.log(
        `Completed orders page ${page}/${Math.max(1, Math.ceil(total / limit))} (total ${total})`,
      );

      return {
        items,
        pagination: {
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          page,
          limit,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve completed orders: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Paginated feed for the admin driver-dispatch board. Returns orders that have
   * been assigned to a bakery and are still active (anything except
   * delivered/cancelled), so an admin can assign/track a delivery driver.
   * Items carry their driver assignment state (driverId / driverData /
   * driverAssignedAt) so the board can render the assignment chip.
   */
  async getForDispatch(query: GetDispatchOrdersQueryDto): Promise<{
    items: OrderResponseDto[];
    pagination: { total: number; totalPages: number; page: number; limit: number };
  }> {
    const page = query.page ?? PAGINATION_DEFAULTS.PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULTS.LIMIT;
    const sortDir = query.sort ?? 'desc';
    const offset = (page - 1) * limit;

    // Active, non-terminal statuses only — delivered/cancelled orders aren't dispatched.
    const dispatchStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'];

    try {
      const conditions: SQL[] = [
        isNotNull(orders.bakeryId),
        inArray(
          orders.orderStatus,
          dispatchStatuses as (typeof orders.orderStatus.enumValues)[number][],
        ),
      ];

      if (query.regionId) {
        conditions.push(eq(orders.regionId, query.regionId));
      }
      if (query.bakeryId) {
        conditions.push(eq(orders.bakeryId, query.bakeryId));
      }
      if (query.q && query.q.trim()) {
        conditions.push(ilike(orders.referenceNumber, `%${query.q.trim()}%`));
      }
      // driverState: unassigned = no driver; assigned = driver set but not yet
      // accepted (driverData null); accepted = driver accepted (driverData set).
      if (query.driverState === 'unassigned') {
        conditions.push(isNull(orders.driverId));
      } else if (query.driverState === 'assigned') {
        conditions.push(isNotNull(orders.driverId));
        conditions.push(isNull(orders.driverData));
      } else if (query.driverState === 'accepted') {
        conditions.push(isNotNull(orders.driverId));
        conditions.push(isNotNull(orders.driverData));
      }

      const where = and(...conditions);

      const [{ count }] = await db
        .select({ count: sql<string>`COUNT(*)` })
        .from(orders)
        .where(where);
      const total = typeof count === 'string' ? parseInt(count, 10) : count;

      const pageRows = await db
        .select()
        .from(orders)
        .where(where)
        .orderBy(sortDir === 'asc' ? asc(orders.createdAt) : desc(orders.createdAt))
        .limit(limit)
        .offset(offset);

      const orderIds = pageRows
        .map((order) => order.id)
        .filter((orderId): orderId is string => Boolean(orderId));

      const pageItems =
        orderIds.length > 0
          ? await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds))
          : [];
      const groupedItems = this.groupOrderItemsByOrderId(pageItems);

      const items = await Promise.all(
        pageRows.map(async (order): Promise<OrderResponseDto> => {
          try {
            if (!order.id) throw new Error('Order id is missing');
            const formattedItems = await this.formatOrderItemsResponse(
              groupedItems[order.id] || [],
              query.regionId ?? order.regionId,
            );
            return this.buildOrderResponse(order, formattedItems);
          } catch {
            return this.buildBasicOrderResponse(order);
          }
        }),
      );

      this.logger.log(
        `Dispatch orders page ${page}/${Math.max(1, Math.ceil(total / limit))} (total ${total})`,
      );

      return {
        items,
        pagination: {
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          page,
          limit,
        },
      };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve dispatch orders: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_list',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async getOne(orderId: string, regionId?: string): Promise<OrderResponseDto> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

      this.logger.log(`Fetching order details for order ID: ${orderId} with ${items.length} items`);

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found`);
        throw new NotFoundException(
          errorResponse('routes.orders.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
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
        ...this.exposeOrderFields(order),
        bakeryId: order.bakeryId || undefined,
        totalCapacity: order.totalCapacity || 0,
        deliveryNote: order.deliveryNote || '',
        totalPrice: parseFloat(order.totalPrice),
        discountAmount: parseFloat(order.discountAmount),
        finalPrice: parseFloat(order.finalPrice),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Failed to retrieve order ${orderId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : '',
      );
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_retrieve',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async cancel(orderId: string, userId: string): Promise<ChangeOrderStatusResponseDto> {
    try {
      const [order] = await db
        .select()
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)));

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found for user: ${userId}`);
        throw new NotFoundException(
          errorResponse(
            'routes.orders.not_found_or_not_authorized_to_cancel',
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
            `routes.orders.cannot_be_cancelled`,
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
            { status: order.orderStatus },
          ),
        );
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({ orderStatus: 'cancelled' })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, status: orders.orderStatus });

      this.logger.log(`Order ${orderId} cancelled successfully`);

      await this.notificationService.pushNotificationSafe({
        title: 'Order cancelled',
        body: `Your order ${order.referenceNumber ?? ''} has been cancelled.`,
        type: 'order_status',
        recipientType: 'user',
        recipientId: userId,
        redirectId: orderId,
        data: { orderId, status: 'cancelled' },
      });

      await this.notificationService.pushToPlatformAdmins({
        title: 'Order cancelled by customer',
        body: `Order ${order.referenceNumber ?? orderId} was cancelled by the customer.`,
        type: 'order_status',
        redirectId: orderId,
        data: { orderId, status: 'cancelled' },
      });

      if (order.bakeryId) {
        await this.notificationService.pushToBakeryStaff(order.bakeryId, {
          title: 'Order cancelled by customer',
          body: `Order ${order.referenceNumber ?? orderId} was cancelled by the customer.`,
          type: 'order_status',
          redirectId: orderId,
          data: { orderId, status: 'cancelled' },
        });
      }

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
          'routes.orders.failed_cancel',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async refuse(orderId: string): Promise<ChangeOrderStatusResponseDto> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found`);
        throw new NotFoundException(
          errorResponse('routes.orders.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({ orderStatus: 'cancelled' })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, status: orders.orderStatus });

      this.logger.log(`Order ${orderId} refused (cancelled) successfully`);

      if (order.userId) {
        await this.notificationService.pushNotificationSafe({
          title: 'Order refused',
          body: `We were unable to fulfil your order ${order.referenceNumber ?? ''}. Please contact support.`,
          type: 'order_status',
          recipientType: 'user',
          recipientId: order.userId,
          redirectId: orderId,
          data: { orderId, status: 'cancelled', reason: 'refused' },
        });
      }

      if (order.bakeryId) {
        await this.notificationService.pushToBakeryStaff(order.bakeryId, {
          title: 'Order refused by admin',
          body: `Order ${order.referenceNumber ?? orderId} was refused by an admin.`,
          type: 'order_status',
          redirectId: orderId,
          data: { orderId, status: 'cancelled', reason: 'refused' },
        });
      }

      return updatedOrder;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to refuse order ${orderId}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_refuse',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async changeStatus(
    orderId: string,
    { status }: ChangeOrderStatusDto,
  ): Promise<ChangeOrderStatusResponseDto> {
    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found`);
        throw new NotFoundException(
          errorResponse('routes.orders.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      /*
        If a driver has already accepted this order (driverData is set), marking it
        'ready' sends it straight to 'out_for_delivery' instead — the driver was just
        waiting on the bakery. driverData is already populated, so it shows immediately.
      */
      const driverAlreadyAccepted = !!order.driverData;
      const flipsToDelivery = status === 'ready' && driverAlreadyAccepted;
      const effectiveStatus = flipsToDelivery ? 'out_for_delivery' : status;

      const [updatedOrder] = await db
        .update(orders)
        .set({
          orderStatus: effectiveStatus,
          deliveredAt: effectiveStatus === 'delivered' ? new Date() : null,
        })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, status: orders.orderStatus });

      this.logger.log(`Order ${orderId} status changed to ${effectiveStatus} successfully`);

      if (order.userId && effectiveStatus) {
        const { title, body } = this.buildStatusMessage(
          effectiveStatus,
          order.referenceNumber ?? '',
        );
        await this.notificationService.pushNotificationSafe({
          title,
          body,
          type: 'order_status',
          recipientType: 'user',
          recipientId: order.userId,
          redirectId: orderId,
          data: { orderId, status: effectiveStatus },
        });
      }

      // The order flipped to out_for_delivery because the driver had accepted earlier:
      // let the driver know the order is ready to be picked up.
      if (flipsToDelivery && order.driverId) {
        await this.notificationService.pushNotificationSafe({
          title: 'Order ready for delivery',
          body: `Order ${order.referenceNumber ?? orderId} is ready. Please start the delivery.`,
          type: 'order_status',
          recipientType: 'admin',
          recipientId: order.driverId,
          redirectId: orderId,
          data: { orderId, status: 'out_for_delivery' },
        });
      }

      if (order.bakeryId && effectiveStatus) {
        await this.notificationService.pushToBakeryStaff(order.bakeryId, {
          title: 'Order status updated',
          body: `Order ${order.referenceNumber ?? orderId} is now ${effectiveStatus}.`,
          type: 'order_status',
          redirectId: orderId,
          data: { orderId, status: effectiveStatus },
        });
      }

      if (
        status &&
        (['ready', 'delivered', 'cancelled'] as const).includes(
          status as 'ready' | 'delivered' | 'cancelled',
        )
      ) {
        const statusLabel = status === 'cancelled' ? 'canceled' : status;
        await this.notificationService.pushToSuperAdmins({
          title: `Order ${statusLabel} by bakery`,
          body: `Order ${order.referenceNumber ?? orderId} was marked as ${statusLabel} by the bakery.`,
          type: 'order_status',
          redirectId: orderId,
          data: { orderId, status },
        });
      }

      return updatedOrder;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to change order status for order ${orderId} to ${status}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_change_status',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Reserve (decrement) or release (increment) a bakery's stock for every
   * stockable item on an order. Shared by assign / re-assign / unassign so a
   * bakery's reserved stock always matches the orders currently sitting with it.
   */
  private async adjustStockForOrderItems(
    orderId: string,
    regionId: string,
    bakeryId: string,
    op: 'increment' | 'decrement',
    force = false,
  ): Promise<void> {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

    for (const item of items) {
      if (!item.addonId && !item.sweetId && !item.featuredCakeId) {
        continue;
      }

      const regionItemCondition = item.addonId
        ? eq(regionItemPrices.addonId, item.addonId)
        : item.sweetId
          ? eq(regionItemPrices.sweetId, item.sweetId)
          : eq(regionItemPrices.featuredCakeId, item.featuredCakeId as string);

      const [regionItem] = await db
        .select()
        .from(regionItemPrices)
        .where(and(eq(regionItemPrices.regionId, regionId), regionItemCondition))
        .limit(1);

      if (!regionItem) {
        continue;
      }

      if (op === 'decrement') {
        await this.stockService.decrementStock(
          bakeryId,
          regionItem.id,
          item.quantity,
          item.selectedOptions?.[0]?.optionId,
          force,
        );
      } else {
        await this.stockService.incrementStock(
          bakeryId,
          regionItem.id,
          item.quantity,
          item.selectedOptions?.[0]?.optionId,
          force,
        );
      }
    }
  }

  /**
   * Read-only check: which of an order's stockable items (addons / sweets /
   * featured cakes) the target bakery cannot fully reserve — either it has no
   * stock record for the item (`not_stocked`) or not enough on hand
   * (`insufficient`). Used to block a normal reassign so the admin can decide
   * whether to force it.
   */
  private async checkStockForOrderItems(
    orderId: string,
    regionId: string,
    bakeryId: string,
  ): Promise<BakeryStockIssue[]> {
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    const issues: BakeryStockIssue[] = [];

    for (const item of items) {
      if (!item.addonId && !item.sweetId && !item.featuredCakeId) {
        continue;
      }

      const regionItemCondition = item.addonId
        ? eq(regionItemPrices.addonId, item.addonId)
        : item.sweetId
          ? eq(regionItemPrices.sweetId, item.sweetId)
          : eq(regionItemPrices.featuredCakeId, item.featuredCakeId as string);

      const [regionItem] = await db
        .select()
        .from(regionItemPrices)
        .where(and(eq(regionItemPrices.regionId, regionId), regionItemCondition))
        .limit(1);

      if (!regionItem) {
        continue;
      }

      const [store] = await db
        .select({
          stock: bakeryItemStores.stock,
          optionsStock: bakeryItemStores.optionsStock,
        })
        .from(bakeryItemStores)
        .where(
          and(
            eq(bakeryItemStores.bakeryId, bakeryId),
            eq(bakeryItemStores.regionItemPriceId, regionItem.id),
          ),
        )
        .limit(1);

      const optionId = item.selectedOptions?.[0]?.optionId;
      let reason: 'not_stocked' | 'insufficient' | null = null;
      let available = 0;

      if (!store) {
        reason = 'not_stocked';
      } else if (optionId) {
        const option = store.optionsStock?.find((o) => o.optionId === optionId);
        if (!option) {
          reason = 'not_stocked';
        } else if (option.stock < item.quantity) {
          reason = 'insufficient';
          available = option.stock;
        }
      } else if (store.stock < item.quantity) {
        reason = 'insufficient';
        available = store.stock;
      }

      if (reason) {
        issues.push({
          name: await this.resolveOrderItemName(item),
          reason,
          requested: item.quantity,
          available,
        });
      }
    }

    return issues;
  }

  /** Localised display name for a stockable order item (addon / sweet / featured cake). */
  private async resolveOrderItemName(item: typeof orderItems.$inferSelect): Promise<string> {
    try {
      if (item.addonId) {
        const [row] = await db
          .select({ name: this.translationService.getLocalized(addons.name, 'name') })
          .from(addons)
          .where(eq(addons.id, item.addonId))
          .limit(1);
        return row?.name || 'Item';
      }
      if (item.sweetId) {
        const [row] = await db
          .select({ name: this.translationService.getLocalized(sweets.name, 'name') })
          .from(sweets)
          .where(eq(sweets.id, item.sweetId))
          .limit(1);
        return row?.name || 'Item';
      }
      if (item.featuredCakeId) {
        const [row] = await db
          .select({ name: this.translationService.getLocalized(featuredCakes.name, 'name') })
          .from(featuredCakes)
          .where(eq(featuredCakes.id, item.featuredCakeId))
          .limit(1);
        return row?.name || 'Item';
      }
    } catch {
      // Name resolution is best-effort — never let it break the stock check.
    }
    return 'Item';
  }

  async assignToBakery(
    orderId: string,
    { bakeryId, force = false }: AssignBakeryDto,
  ): Promise<AssignBakeryResponseDto> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

    if (!order) {
      this.logger.warn(`Order with id: ${orderId} not found`);
      throw new NotFoundException(
        errorResponse('routes.orders.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // Admins can (re)assign an order while it is still early in its lifecycle —
    // not only while pending. Once it is ready / out for delivery / delivered /
    // cancelled it is too late to move it to another bakery.
    const reassignableStatuses: string[] = ['pending', 'confirmed', 'preparing'];
    if (!reassignableStatuses.includes(order.orderStatus)) {
      this.logger.warn(
        `Order with id: ${orderId} cannot be assigned to a bakery in status: ${order.orderStatus}`,
      );
      throw new BadRequestException(
        errorResponse(
          `routes.orders.not_reassignable`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          {
            orderId,
            status: order.orderStatus,
          },
        ),
      );
    }

    const [bakery] = await db.select().from(bakeries).where(eq(bakeries.id, bakeryId)).limit(1);

    if (!bakery) {
      this.logger.warn(`Bakery with id: ${bakeryId} not found`);
      throw new NotFoundException(
        errorResponse('routes.bakery.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (bakery.regionId !== order.regionId) {
      this.logger.warn(
        `Bakery with id: ${bakeryId} does not belong to the same region as the order`,
      );
      throw new BadRequestException(
        errorResponse(
          `routes.orders.not_same_region`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          { bakeryId, orderId },
        ),
      );
    }

    const previousBakeryId = order.bakeryId;

    // Re-assigning to the same bakery is a no-op — don't double-reserve stock.
    if (previousBakeryId === bakeryId) {
      return { id: order.id, bakeryId };
    }

    // Unless the admin forces the move, block when the target bakery can't fully
    // stock the order and report exactly which items, so the UI can offer a
    // "reassign anyway" confirmation that retries with force=true.
    if (!force) {
      const stockIssues = await this.checkStockForOrderItems(orderId, order.regionId, bakeryId);
      if (stockIssues.length > 0) {
        this.logger.warn(
          `Bakery ${bakeryId} cannot fully stock order ${orderId}: ${stockIssues
            .map((i) => i.name)
            .join(', ')}`,
        );
        throw new BadRequestException(
          errorResponse(
            'routes.orders.bakery_stock_issue',
            HttpStatus.BAD_REQUEST,
            'BAKERY_STOCK_ISSUE',
            { forceable: true, issues: stockIssues },
          ),
        );
      }
    }

    try {
      // Reserve stock at the NEW bakery. With `force` this is best-effort (skips
      // missing stores, never goes negative); without it the pre-check above has
      // already guaranteed there's enough, so nothing is left half-changed.
      await this.adjustStockForOrderItems(orderId, order.regionId, bakeryId, 'decrement', force);

      // Re-assignment: release the stock previously reserved at the old bakery.
      // Best-effort — releasing should never block the move.
      if (previousBakeryId) {
        await this.adjustStockForOrderItems(
          orderId,
          order.regionId,
          previousBakeryId,
          'increment',
          true,
        );
      }

      // Reset to pending so the newly assigned bakery owns a fresh order it must
      // confirm again — while keeping the rest of the order data intact. For a
      // first-time assignment of an already-pending order this is a no-op.
      const [updatedOrder] = await db
        .update(orders)
        .set({
          bakeryId: bakeryId,
          assigningDate: new Date(),
          orderStatus: 'pending',
        })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, bakeryId: orders.bakeryId });

      this.logger.log(
        previousBakeryId
          ? `Order ${orderId} reassigned from bakery ${previousBakeryId} to ${bakeryId} successfully`
          : `Order ${orderId} assigned to bakery ${bakeryId} successfully`,
      );

      await this.notificationService.pushToBakeryStaff(bakeryId, {
        title: 'New order assigned',
        body: `Order ${order.referenceNumber ?? orderId} has been assigned to your bakery.`,
        type: 'new_order',
        redirectId: orderId,
        data: { orderId, bakeryId },
      });

      // Tell the previous bakery the order has moved away from them.
      if (previousBakeryId) {
        await this.notificationService.pushToBakeryStaff(previousBakeryId, {
          title: 'Order reassigned',
          body: `Order ${order.referenceNumber ?? orderId} has been reassigned to another bakery.`,
          type: 'order_update',
          redirectId: orderId,
          data: { orderId, bakeryId: previousBakeryId },
        });
      }

      return {
        id: updatedOrder.id,
        bakeryId: updatedOrder.bakeryId || '',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to assign order ${orderId} to bakery ${bakeryId}:`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_assign_to_bakery',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async assignToDriver(
    orderId: string,
    { driverId }: AssignDriverDto,
  ): Promise<{ id: string; driverId: string | null; driverAssignedAt: Date | null }> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      this.logger.warn(`Order with id: ${orderId} not found`);
      throw new NotFoundException(
        errorResponse('routes.orders.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (driverId === undefined) {
      throw new BadRequestException(
        errorResponse(
          'routes.orders.invalid_driver_assignment',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    if (order.orderStatus === 'delivered' || order.orderStatus === 'cancelled') {
      throw new BadRequestException(
        errorResponse(
          'routes.orders.assign_driver_invalid_state',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    // Unassign flow
    if (driverId === null) {
      const nextStatus = order.orderStatus === 'out_for_delivery' ? 'ready' : order.orderStatus;

      const [updatedOrder] = await db
        .update(orders)
        .set({
          driverId: null,
          driverAssignedAt: null,
          driverData: null,
          orderStatus: nextStatus,
        })
        .where(eq(orders.id, orderId))
        .returning({
          id: orders.id,
          driverId: orders.driverId,
          driverAssignedAt: orders.driverAssignedAt,
        });

      return updatedOrder;
    }

    const [driver] = await db
      .select({ id: admins.id, regionId: admins.regionId, isBlocked: admins.isBlocked })
      .from(admins)
      .where(and(eq(admins.id, driverId), eq(admins.role, 'driver')))
      .limit(1);

    if (!driver) {
      this.logger.warn(`Driver with id: ${driverId} not found`);
      throw new NotFoundException(
        errorResponse('routes.driver.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // A blocked driver can't take deliveries.
    if (driver.isBlocked) {
      this.logger.warn(`Attempt to assign blocked driver ${driverId} to order ${orderId}`);
      throw new BadRequestException(
        errorResponse('routes.driver.blocked', HttpStatus.BAD_REQUEST, 'BadRequestException'),
      );
    }

    // Drivers are region-scoped: only a driver from the order's region may deliver it.
    if (driver.regionId !== order.regionId) {
      this.logger.warn(
        `Driver ${driverId} (region ${driver.regionId ?? '-'}) does not match order ${orderId} region ${order.regionId}`,
      );
      throw new BadRequestException(
        errorResponse(
          'routes.orders.driver_region_mismatch',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        driverId,
        driverAssignedAt: new Date(),
        driverData: null,
      })
      .where(eq(orders.id, orderId))
      .returning({
        id: orders.id,
        driverId: orders.driverId,
        driverAssignedAt: orders.driverAssignedAt,
      });

    return updatedOrder;
  }

  async generateDeliveryCheckCode(orderId: string, driverId: string) {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      throw new NotFoundException('routes.orders.not_found');
    }

    if (order.driverId !== driverId) {
      throw new BadRequestException('routes.orders.not_assigned_to_driver');
    }

    if (order.orderStatus !== 'out_for_delivery') {
      throw new BadRequestException('routes.orders.delivery_code_invalid_state');
    }

    const deliveryCheckCode = randomInt(100000, 1000000).toString();
    const deliveryCheckCodeHash = createHmac('sha256', env.JWT_ACCESS_SECRET)
      .update(deliveryCheckCode)
      .digest('hex');

    await db
      .update(orders)
      .set({
        deliveryCheckCodeHash,
      })
      .where(eq(orders.id, orderId));

    return successResponse(
      {
        orderId,
        deliveryCheckCode,
      },
      'routes.orders.delivery_code_generated',
      HttpStatus.OK,
    );
  }

  async verifyDeliveryCheckCode(
    orderId: string,
    userId: string,
    { deliveryCheckCode }: VerifyDeliveryCodeDto,
  ) {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      throw new NotFoundException('routes.orders.not_found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('routes.orders.not_authorized_for_verification');
    }

    if (!order.deliveryCheckCodeHash) {
      throw new BadRequestException('routes.orders.delivery_code_not_generated');
    }

    const providedHash = this.hashDeliveryCheckCode(deliveryCheckCode);
    if (providedHash !== order.deliveryCheckCodeHash) {
      throw new BadRequestException('routes.orders.delivery_code_invalid');
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        orderStatus: 'delivered',
        deliveredAt: new Date(),
        deliveryCheckCodeHash: null,
      })
      .where(eq(orders.id, orderId))
      .returning({
        id: orders.id,
        status: orders.orderStatus,
        deliveredAt: orders.deliveredAt,
      });

    return updatedOrder;
  }

  async unassignFromBakery(
    orderId: string,
    reason?: string,
    options?: { bypassTimeLimit?: boolean },
  ): Promise<{ id: string; bakeryId: string }> {
    // Platform admins returning an order to the pool bypass the 1-hour window;
    // a bakery declining its own order is still capped to that window.
    const bypassTimeLimit = options?.bypassTimeLimit ?? false;

    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

    if (!order) {
      this.logger.warn(`Order with id: ${orderId} not found`);
      throw new NotFoundException(
        errorResponse('routes.orders.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    if (!order.bakeryId) {
      this.logger.warn(`Order with id: ${orderId} is not assigned to a bakery`);
      throw new BadRequestException(
        errorResponse(
          'routes.orders.not_assigned_to_bakery',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          { orderId },
        ),
      );
    }

    // Platform admins (bypassTimeLimit) can pull an order back to the unassigned
    // pool even after the bakery confirmed/started it. A bakery declining its own
    // order stays restricted to pending (plus the 1-hour window enforced below).
    const returnableStatuses: string[] = bypassTimeLimit
      ? ['pending', 'confirmed', 'preparing']
      : ['pending'];
    if (!returnableStatuses.includes(order.orderStatus)) {
      this.logger.warn(
        `Order with id: ${orderId} cannot be un-assigned from a bakery in status: ${order.orderStatus}`,
      );
      throw new BadRequestException(
        errorResponse(
          `routes.orders.not_reassignable`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          {
            orderId,
            status: order.orderStatus,
          },
        ),
      );
    }

    // NOTE: we intentionally do NOT require `assigningDate` here. An order can
    // carry a bakeryId without one (seeded / legacy / imported rows), and the
    // bakeryId check above is what determines "assigned". `assigningDate` only
    // gates the 1-hour decline window below, which already tolerates a null.
    if (
      !bypassTimeLimit &&
      order.assigningDate &&
      new Date().getTime() - new Date(order.assigningDate).getTime() > 60 * 60 * 1000
    ) {
      this.logger.warn(
        `Order with id: ${orderId} has been assigned to a bakery since more than 1 hour, so it cannot be unassigned`,
      );
      throw new BadRequestException(
        errorResponse(
          `routes.orders.assinged_for_too_long`,
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
          { orderId },
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

      // Best-effort release — returning an order to the pool must never be
      // blocked by a missing stock record at the old bakery.
      await this.adjustStockForOrderItems(
        orderId,
        order.regionId,
        bakeryIdToUnassign,
        'increment',
        true,
      );

      this.logger.log(`Order ${orderId} successfully unassigned from bakery`);

      if (order.userId) {
        await this.notificationService.pushNotificationSafe({
          title: bypassTimeLimit ? 'Order update' : 'Bakery cancelled your order',
          body: bypassTimeLimit
            ? `Your order ${order.referenceNumber ?? ''} is being reassigned to another bakery.`
            : `Your assigned bakery declined order ${order.referenceNumber ?? ''}. We're finding you another one.`,
          type: 'order_cancelled_by_bakery',
          recipientType: 'user',
          recipientId: order.userId,
          redirectId: orderId,
          data: {
            orderId,
            bakeryId: bakeryIdToUnassign,
            ...(reason ? { reason } : {}),
          },
        });
      }

      // The "bakery declined" alert is only meaningful when the bakery itself
      // backed out — an admin returning the order to the pool already knows.
      if (!bypassTimeLimit) {
        await this.notificationService.pushToPlatformAdmins({
          title: 'Bakery declined an order',
          body: `Bakery unassigned itself from order ${order.referenceNumber ?? orderId}${
            reason ? ` — reason: ${reason}` : ''
          }.`,
          type: 'order_cancelled_by_bakery',
          redirectId: orderId,
          data: {
            orderId,
            bakeryId: bakeryIdToUnassign,
            ...(reason ? { reason } : {}),
          },
        });
      }

      await this.notificationService.pushToBakeryStaff(bakeryIdToUnassign, {
        title: 'Order unassigned',
        body: `Order ${order.referenceNumber ?? orderId} is no longer assigned to your bakery.`,
        type: 'order_update',
        redirectId: orderId,
        data: { orderId, bakeryId: bakeryIdToUnassign },
      });

      return {
        id: updatedOrder.id,
        bakeryId: updatedOrder.bakeryId || '',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to unassign order ${orderId} from bakery:`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_unassign_from_bakery',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Bakeries the admin can hand this order to: same region, able to handle the
   * order's type, each with its current capacity usage so the admin can pick one
   * with room. The currently-assigned bakery is included and flagged `isCurrent`.
   */
  async getAvailableBakeriesForOrder(orderId: string): Promise<AvailableBakeryDto[]> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

    if (!order) {
      this.logger.warn(`Order with id: ${orderId} not found`);
      throw new NotFoundException(
        errorResponse('routes.orders.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    // Order cart types and bakery types label the "large cake" tier differently
    // (big_cakes vs large_cakes); normalise the order's type before matching.
    const cartToBakeryType: Record<string, string> = {
      big_cakes: 'large_cakes',
      small_cakes: 'small_cakes',
      others: 'others',
    };
    const requiredType = cartToBakeryType[order.cartType] ?? order.cartType;

    const regionBakeries = await db
      .select({
        id: bakeries.id,
        name: this.translationService.getLocalized(bakeries.name, 'name'),
        bakeryTypes: bakeries.bakeryTypes,
        capacity: bakeries.capacity,
      })
      .from(bakeries)
      .where(and(eq(bakeries.regionId, order.regionId), eq(bakeries.isDeleted, false)));

    const matching = regionBakeries.filter((bakery) =>
      (bakery.bakeryTypes ?? []).some((type) => type === requiredType),
    );

    if (matching.length === 0) {
      return [];
    }

    const bakeryIds = matching.map((bakery) => bakery.id);

    // Used capacity = sum of capacity slots of each bakery's still-active orders
    // (anything not delivered/cancelled is still occupying a slot).
    const usageRows = await db
      .select({
        bakeryId: orders.bakeryId,
        used: sql<number>`COALESCE(SUM(${orders.totalCapacity}), 0)`,
      })
      .from(orders)
      .where(
        and(
          inArray(orders.bakeryId, bakeryIds),
          not(
            inArray(orders.orderStatus, [
              'delivered',
              'cancelled',
            ] as (typeof orders.orderStatus.enumValues)[number][]),
          ),
        ),
      )
      .groupBy(orders.bakeryId);

    const usedByBakery = new Map<string, number>();
    for (const row of usageRows) {
      if (row.bakeryId) usedByBakery.set(row.bakeryId, Number(row.used) || 0);
    }

    return matching.map((bakery) => {
      const usedCapacity = usedByBakery.get(bakery.id) ?? 0;
      return {
        id: bakery.id,
        name: bakery.name,
        types: bakery.bakeryTypes ?? [],
        capacity: bakery.capacity,
        usedCapacity,
        availableCapacity: Math.max(0, bakery.capacity - usedCapacity),
        isCurrent: bakery.id === order.bakeryId,
      };
    });
  }

  async finalizeData(orderId: string, data: FinalizeOrderDto): Promise<FinalizeOrderResponseDto> {
    const bakeryId = data.bakeryId;

    // Verify data contains at least one final image
    if (!data.finalImages || data.finalImages.length === 0) {
      this.logger.warn(`At least one final image is required to finalize the order`);
      throw new BadRequestException(
        errorResponse(
          'routes.orders.final_images_required',
          HttpStatus.BAD_REQUEST,
          'BadRequestException',
        ),
      );
    }

    try {
      const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

      // Verify order exists
      if (!order) {
        this.logger.warn(`Order with id: ${orderId} not found`);
        throw new NotFoundException(
          errorResponse('routes.orders.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }

      // Verify order is in correct status: 'preparing'
      if (order.orderStatus !== 'preparing') {
        this.logger.warn(
          `Order with id: ${orderId} must be in preparing status to be finalized. Current status: ${order.orderStatus}`,
        );
        throw new BadRequestException(
          errorResponse(
            `routes.orders.not_preparing`,
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
            { orderId, status: order.orderStatus },
          ),
        );
      }

      // Verify order is assigned to the requesting bakery
      if (order.bakeryId !== bakeryId) {
        this.logger.warn(
          `Order with id: ${orderId} is not assigned to bakery ${bakeryId}. Current bakery: ${order.bakeryId}`,
        );
        throw new BadRequestException(
          errorResponse(
            'routes.orders.not_assined_to_this_bakery',
            HttpStatus.BAD_REQUEST,
            'BadRequestException',
            { orderId, bakeryId, currentBakeryId: order.bakeryId },
          ),
        );
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({
          qa: {
            finalImages: data.finalImages || [],
            notes: data.notes || [],
          },
        })
        .where(eq(orders.id, orderId))
        .returning({ id: orders.id, qa: orders.qa, bakeryId: orders.bakeryId });

      this.logger.log(`Order ${orderId} finalized successfully`);

      if (order.userId) {
        await this.notificationService.pushNotificationSafe({
          title: 'Your order is ready for review',
          body: `Final preview images have been uploaded for order ${order.referenceNumber ?? ''}.`,
          type: 'order_update',
          recipientType: 'user',
          recipientId: order.userId,
          redirectId: orderId,
          data: { orderId, event: 'qa_finalized' },
        });
      }

      return {
        id: updatedOrder.id,
        bakeryId: updatedOrder.bakeryId || '',
        qa: {
          finalImages: updatedOrder.qa?.finalImages || [],
          notes: updatedOrder.qa?.notes || [],
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Failed to finalize order ${orderId} for bakery ${bakeryId}:`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_finalize',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  /**
   * Admin financials view (all bakeries, optionally scoped by bakeryId).
   * Includes orders from "ready" through "delivered" and filters the
   * from/to range on createdAt, since not-yet-delivered orders have no
   * deliveredAt yet.
   */
  async getOrdersFinancials(
    dto: GetOrdersFinancialsDto,
  ): Promise<SuccessResponse<GetOrdersFinancialsResponseDto>> {
    const { bakeryId, from, to, page, limit } = dto;
    return this.computeFinancials({
      bakeryId,
      from,
      to,
      page,
      limit,
      statuses: ['ready', 'out_for_delivery', 'delivered'],
      dateField: 'createdAt',
    });
  }

  /**
   * Bakery-scoped financials for the bakery manager view.
   * Includes orders from "ready" through "delivered" and filters the
   * from/to range on createdAt, since not-yet-delivered orders have no
   * deliveredAt yet.
   */
  async getBakeryFinancials(
    bakeryId: string,
    dto: GetOrdersFinancialsDto,
  ): Promise<SuccessResponse<GetOrdersFinancialsResponseDto>> {
    const { from, to, page, limit } = dto;
    return this.computeFinancials({
      bakeryId,
      from,
      to,
      page,
      limit,
      statuses: ['ready', 'out_for_delivery', 'delivered'],
      dateField: 'createdAt',
    });
  }

  private async computeFinancials(opts: {
    bakeryId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
    statuses: (typeof orders.orderStatus.enumValues)[number][];
    dateField: 'deliveredAt' | 'createdAt';
  }): Promise<SuccessResponse<GetOrdersFinancialsResponseDto>> {
    const { bakeryId, from, to, page, limit, statuses, dateField } = opts;
    const dateColumn = dateField === 'createdAt' ? orders.createdAt : orders.deliveredAt;

    try {
      const conditions: SQL[] = [];

      if (bakeryId) {
        const [bakery] = await db
          .select({
            name: this.translationService.getLocalized(bakeries.name, 'name'),
          })
          .from(bakeries)
          .where(eq(bakeries.id, bakeryId))
          .limit(1);

        if (!bakery) {
          this.logger.warn(`Bakery with id: ${bakeryId} not found`);
          throw new NotFoundException(
            errorResponse('routes.bakery.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
          );
        }

        conditions.push(eq(orders.bakeryId, bakeryId));
      }

      if (from) {
        const fromCondition = and(isNotNull(dateColumn), gte(dateColumn, new Date(from)));
        if (fromCondition) conditions.push(fromCondition);
      }

      if (to) {
        const toCondition = and(isNotNull(dateColumn), lte(dateColumn, new Date(to)));
        if (toCondition) conditions.push(toCondition);
      }

      conditions.push(inArray(orders.orderStatus, statuses));

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const resolvedPage = page ?? PAGINATION_DEFAULTS.PAGE;
      const resolvedLimit = Math.min(
        limit ?? PAGINATION_DEFAULTS.LIMIT,
        PAGINATION_DEFAULTS.MAX_LIMIT,
      );
      const offset = (resolvedPage - 1) * resolvedLimit;

      const ordersTotalList = await db
        .select({
          orderId: orders.id,
          referenceNumber: orders.referenceNumber,
          bakeryId: orders.bakeryId,
          addonsTotal: orders.addonsTotal,
          bastiPercentage: orders.bastiPercentage,
          deliveryAmount: orders.deliveryAmount,
          bastiDeliveryAmount: orders.bastiDeliveryAmount,
          totalPrice: orders.totalPrice,
          discountAmount: orders.discountAmount,
          finalPrice: orders.finalPrice,
          orderStatus: orders.orderStatus,
          deliveredAt: orders.deliveredAt,
          createdAt: orders.createdAt,
          bakeryName: this.translationService.getLocalized(bakeries.name, 'name'),
        })
        .from(orders)
        .leftJoin(bakeries, eq(orders.bakeryId, bakeries.id))
        .where(whereClause)
        .orderBy(desc(dateColumn));

      if (!ordersTotalList || ordersTotalList.length === 0) {
        this.logger.log('No orders matched the financials filters; returning empty result');
        return successResponse(
          {
            rows: [],
            total: {
              addonsTotal: 0,
              bastiTotal: 0,
              bakeryTotal: 0,
              deliveryAmount: 0,
              bastiDeliveryAmount: 0,
              totalPrice: 0,
              discountAmount: 0,
              finalPrice: 0,
            },
            pagination: {
              total: 0,
              limit: resolvedLimit,
              page: resolvedPage,
              totalPages: 0,
            },
          },
          'routes.orders.financials_retrieved',
        );
      }

      const ordersList = await db
        .select({
          orderId: orders.id,
          referenceNumber: orders.referenceNumber,
          bakeryId: orders.bakeryId,
          addonsTotal: orders.addonsTotal,
          bastiPercentage: orders.bastiPercentage,
          deliveryAmount: orders.deliveryAmount,
          bastiDeliveryAmount: orders.bastiDeliveryAmount,
          totalPrice: orders.totalPrice,
          discountAmount: orders.discountAmount,
          finalPrice: orders.finalPrice,
          orderStatus: orders.orderStatus,
          deliveredAt: orders.deliveredAt,
          createdAt: orders.createdAt,
          bakeryName: this.translationService.getLocalized(bakeries.name, 'name'),
        })
        .from(orders)
        .leftJoin(bakeries, eq(orders.bakeryId, bakeries.id))
        .where(whereClause)
        .orderBy(desc(dateColumn))
        .limit(resolvedLimit)
        .offset(offset);

      const rows = ordersList.map((order) => {
        const totalPrice = Number(order.totalPrice) || 0;
        const bastiPercentage = parseFloat(order.bastiPercentage) || 0;
        const bastiAmount = bastiPercentage * totalPrice;

        return {
          addonsTotal: Number(order.addonsTotal) || 0,
          bastiPercentage,
          bastiAmount,
          deliveryAmount: Number(order.deliveryAmount) || 0,
          bastiDeliveryAmount: Number(order.bastiDeliveryAmount) || 0,
          totalPrice,
          discountAmount: Number(order.discountAmount) || 0,
          finalPrice: Number(order.finalPrice) || 0,
          bakeryId: order.bakeryId || '',
          bakeryName: order.bakeryName || '',
          orderId: order.orderId,
          referenceNumber: order.referenceNumber || '',
          orderStatus: order.orderStatus,
          deliveredAt: order.deliveredAt,
          createdAt: order.createdAt,
        };
      });

      const total = ordersTotalList.reduce(
        (acc, order) => ({
          addonsTotal: acc.addonsTotal + (Number(order.addonsTotal) || 0),
          bastiTotal:
            acc.bastiTotal +
            (parseFloat(order.bastiPercentage) || 0) * (Number(order.totalPrice) || 0) +
            (Number(order.bastiDeliveryAmount) || 0),
          bakeryTotal: acc.bakeryTotal + (Number(order.finalPrice) || 0),
          deliveryAmount: acc.deliveryAmount + (Number(order.deliveryAmount) || 0),
          bastiDeliveryAmount: acc.bastiDeliveryAmount + (Number(order.bastiDeliveryAmount) || 0),
          totalPrice: acc.totalPrice + (Number(order.totalPrice) || 0),
          discountAmount: acc.discountAmount + (Number(order.discountAmount) || 0),
          finalPrice: acc.finalPrice + (Number(order.finalPrice) || 0),
        }),
        {
          addonsTotal: 0,
          bastiTotal: 0,
          bakeryTotal: 0,
          deliveryAmount: 0,
          bastiDeliveryAmount: 0,
          totalPrice: 0,
          discountAmount: 0,
          finalPrice: 0,
        },
      );

      const totalCount = ordersTotalList.length;
      const totalPages = Math.ceil(totalCount / resolvedLimit);

      return successResponse(
        {
          rows,
          total,
          pagination: {
            total: totalCount,
            limit: resolvedLimit,
            page: resolvedPage,
            totalPages,
          },
        },
        'routes.orders.financials_retrieved',
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve financials:`, error);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.orders.failed_financials',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private generateOrderReference(): string {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = randomBytes(3).toString('hex').toUpperCase();
    return `ORD-${datePart}-${randomPart}`;
  }

  private buildStatusMessage(
    status: NonNullable<typeof orders.$inferSelect.orderStatus>,
    referenceNumber: string,
  ): { title: string; body: string } {
    const ref = referenceNumber ? `#${referenceNumber}` : '';
    switch (status) {
      case 'pending':
        return { title: 'Order pending', body: `Your order ${ref} is pending confirmation.` };
      case 'confirmed':
        return { title: 'Order confirmed', body: `Your order ${ref} has been confirmed.` };
      case 'preparing':
        return { title: 'Order preparing', body: `Your order ${ref} is being prepared.` };
      case 'ready':
        return { title: 'Order ready', body: `Your order ${ref} is ready for delivery.` };
      case 'out_for_delivery':
        return {
          title: 'Out for delivery',
          body: `Your order ${ref} is on the way!`,
        };
      case 'delivered':
        return { title: 'Order delivered', body: `Your order ${ref} has been delivered. Enjoy!` };
      case 'cancelled':
        return { title: 'Order cancelled', body: `Your order ${ref} has been cancelled.` };
      default:
        return { title: 'Order updated', body: `Your order ${ref} status has changed.` };
    }
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

  /**
   * Order columns that are safe to send to clients. Strips the internal delivery
   * code hash, and (for customer-facing responses) hides driver details until the
   * order is actually out for delivery.
   */
  private exposeOrderFields(
    order: typeof orders.$inferSelect,
    audience: 'admin' | 'user' = 'admin',
  ) {
    const { deliveryCheckCodeHash, ...rest } = order;
    const driverVisibleToUser =
      order.orderStatus === 'out_for_delivery' || order.orderStatus === 'delivered';

    return {
      ...rest,
      driverData: audience === 'user' && !driverVisibleToUser ? null : rest.driverData,
    };
  }

  private buildBasicOrderResponse(order: typeof orders.$inferSelect): OrderResponseDto {
    return {
      addons: [],
      sweets: [],
      featuredCakes: [],
      predesignedCakes: [],
      customCakes: [],
      ...this.exposeOrderFields(order),
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
      ...this.exposeOrderFields(order),
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
                price: layer.flavor.price,
                offer: layer.flavor.offer,
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
              minPrepHours: item.customCake.decoration.minPrepHours,
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
        const [pdc] = await this.itemService.getPredesignedCakes(
          [item.predesignedCakeId],
          regionId,
        );
        if (pdc) {
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
                  minPrepHours: config.shape.minPrepHours,
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
                  minPrepHours: config.decoration.minPrepHours,
                  decorationUrl: config.decoration.decorationUrl,
                  createdAt: config.decoration.createdAt,
                  updatedAt: config.decoration.updatedAt,
                },
                frostColorValue: config.frostColorValue,
                createdAt: config.createdAt,
                updatedAt: config.updatedAt,
              })),
              price: pdc.price ?? '0',
              offer: pdc.offer,
              createdAt: pdc.createdAt,
              updatedAt: pdc.updatedAt,
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
      } else if (item.featuredCakeId) {
        const [fc] = await this.itemService.getFeaturedCakes([item.featuredCakeId], regionId);
        if (fc) {
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
              price: fc.price ?? '0',
              offer: fc.offer,
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
        }
      } else if (item.addonId) {
        const [addon] = await this.itemService.getAddons([{ id: item.addonId }], regionId);
        if (addon) {
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
              price: addon.price ?? '0',
              offer: addon.offer,
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
        }
      } else if (item.sweetId) {
        const [sweet] = await this.itemService.getSweets([item.sweetId], regionId);
        if (sweet) {
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
              price: sweet.price ?? '0',
              offer: sweet.offer,
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

// {
//   "offerId": "b6937c54-0122-47f8-ad7c-3ced3c31485d",
//   "regionId": "23e2da5b-50a1-4f0e-b051-ce99a8fe620a",
//   "addonId": "526bd77a-f133-4eca-af59-ee60e5025c43",
//   "featuredCakeId": "471d2ceb-f00f-449e-8b24-85b7e91bb2ff",
//   "sweetId": "cddac154-91ee-4501-87e8-dc4bd6e8859f",
//   "predesignedCakeId": "fd35b53c-37d7-45df-ba37-07b993c856f7",
//   "decorationId": "cf343a13-c9ac-4ce2-8081-2e2cc5f5f45d",
//   "flavorId": "c61046b8-e329-4ad5-87da-eb035eacbd1f",
//   "shapeId": "a64454e3-9943-4465-aa37-6ed3d95af3c2"
// }
