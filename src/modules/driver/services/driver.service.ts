import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SQL, and, asc, desc, eq, ilike, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { successResponse, SuccessResponse } from '@/utils';
import {
  CreateReportDto,
  DriverDataDto,
  GetDriverOrdersHistoryQueryDto,
  GetDriversQueryDto,
  GetReportsQueryDto,
} from '../dto';
import { orders, reports, users } from '@/db/schema';
import { PAGINATION_DEFAULTS } from '@/constants/global.constants';
import { NotificationService } from '@/modules/notification/services/notification.service';

export interface PaginationMeta {
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);

  constructor(private readonly notificationService: NotificationService) {}

  async findAll(
    query: GetDriversQueryDto,
  ): Promise<SuccessResponse<{ items: DriverDataDto[]; pagination: PaginationMeta }>> {
    const page = query.page ?? PAGINATION_DEFAULTS.PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULTS.LIMIT;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(admins.role, 'driver')];

    if (typeof query.isBlocked === 'boolean') {
      conditions.push(eq(admins.isBlocked, query.isBlocked));
    }
    if (query.regionId) {
      conditions.push(eq(admins.regionId, query.regionId));
    }
    if (query.q && query.q.trim()) {
      const term = `%${query.q.trim()}%`;
      conditions.push(
        or(ilike(admins.name, term), ilike(admins.email, term), ilike(admins.phoneNumber, term)),
      );
    }

    const where = and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<string>`COUNT(*)` })
      .from(admins)
      .where(where);
    const total = typeof count === 'string' ? parseInt(count, 10) : count;

    const drivers = await db
      .select({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        role: admins.role,
        phoneNumber: admins.phoneNumber,
        dueAmount: admins.dueAmount,
        profileImage: admins.profileImage,
        bakeryId: admins.bakeryId,
        regionId: admins.regionId,
        isBlocked: admins.isBlocked,
        blockedAt: admins.blockedAt,
        createdAt: admins.createdAt,
        updatedAt: admins.updatedAt,
      })
      .from(admins)
      .where(where)
      .orderBy(asc(admins.createdAt))
      .limit(limit)
      .offset(offset);

    this.logger.debug(`Retrieved ${drivers.length}/${total} drivers (page ${page})`);

    return successResponse(
      {
        items: drivers.map((driver) => this.mapDriverData(driver)),
        pagination: {
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          page,
          limit,
        },
      },
      'Drivers retrieved successfully',
      HttpStatus.OK,
    );
  }

  async findOne(id: string): Promise<SuccessResponse<DriverDataDto>> {
    const [driver] = await db.select().from(admins).where(eq(admins.id, id)).limit(1);

    if (!driver) {
      return successResponse(null as any, 'routes.driver.not_found', HttpStatus.NOT_FOUND);
    }

    return successResponse(this.mapDriverData(driver), 'Driver retrieved', HttpStatus.OK);
  }

  async reportDriver(userId: string, driverId: string, createReportDto: CreateReportDto) {
    const { reportBody } = createReportDto;

    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.driverId, driverId),
          eq(orders.userId, userId),
          eq(orders.orderStatus, 'delivered'),
        ),
      )
      .limit(1);

    if (!order) {
      return successResponse(
        null as any,
        'routes.driver.no_delivered_orders',
        HttpStatus.NOT_FOUND,
      );
    }

    const [newReport] = await db
      .insert(reports)
      .values({ userId, driverId, reportBody })
      .returning({
        id: reports.id,
        userId: reports.userId,
        driverId: reports.driverId,
        reportBody: reports.reportBody,
        createdAt: reports.createdAt,
        updatedAt: reports.updatedAt,
      });

    return successResponse(newReport, 'Report created', HttpStatus.CREATED);
  }

  async deleteReport(id: string) {
    await db.delete(reports).where(eq(reports.id, id));
    return successResponse({ message: 'Report deleted' }, 'Report deleted', HttpStatus.OK);
  }

  async getAllReports(query: GetReportsQueryDto) {
    const page = query.page ?? PAGINATION_DEFAULTS.PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULTS.LIMIT;
    const offset = (page - 1) * limit;
    const sortDir = query.sort ?? 'desc';

    const where =
      query.q && query.q.trim() ? ilike(reports.reportBody, `%${query.q.trim()}%`) : undefined;

    const [{ count }] = await db
      .select({ count: sql<string>`COUNT(*)` })
      .from(reports)
      .where(where);
    const total = typeof count === 'string' ? parseInt(count, 10) : count;

    const rows = await db
      .select({ report: reports, user: users, driver: admins })
      .from(reports)
      .innerJoin(users, eq(reports.userId, users.id))
      .innerJoin(admins, eq(reports.driverId, admins.id))
      .where(where)
      .orderBy(sortDir === 'asc' ? asc(reports.createdAt) : desc(reports.createdAt))
      .limit(limit)
      .offset(offset);

    const items = rows.map((r) => ({
      id: r.report.id,
      user: {
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        phoneNumber: r.user.phoneNumber,
      },
      driver: {
        id: r.driver.id,
        name: r.driver.name,
        phoneNumber: r.driver.phoneNumber,
      },
      driverId: r.report.driverId,
      reportBody: r.report.reportBody,
      createdAt: r.report.createdAt,
      updatedAt: r.report.updatedAt,
    }));

    return successResponse(
      {
        items,
        pagination: {
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          page,
          limit,
        },
      },
      'Reports retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getDriverReports(driverId: string, query: GetReportsQueryDto) {
    const page = query.page ?? PAGINATION_DEFAULTS.PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULTS.LIMIT;
    const offset = (page - 1) * limit;
    const sortDir = query.sort ?? 'desc';

    const conditions: SQL[] = [eq(reports.driverId, driverId)];
    if (query.q && query.q.trim()) {
      conditions.push(ilike(reports.reportBody, `%${query.q.trim()}%`));
    }
    const where = and(...conditions);

    const [{ count }] = await db
      .select({ count: sql<string>`COUNT(*)` })
      .from(reports)
      .where(where);
    const total = typeof count === 'string' ? parseInt(count, 10) : count;

    const rows = await db
      .select({ report: reports, user: users })
      .from(reports)
      .innerJoin(users, eq(reports.userId, users.id))
      .where(where)
      .orderBy(sortDir === 'asc' ? asc(reports.createdAt) : desc(reports.createdAt))
      .limit(limit)
      .offset(offset);

    const items = rows.map((r) => ({
      id: r.report.id,
      user: {
        firstName: r.user.firstName,
        lastName: r.user.lastName,
        phoneNumber: r.user.phoneNumber,
      },
      driverId: r.report.driverId,
      reportBody: r.report.reportBody,
      createdAt: r.report.createdAt,
      updatedAt: r.report.updatedAt,
    }));

    return successResponse(
      {
        items,
        pagination: {
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          page,
          limit,
        },
      },
      'Reports retrieved successfully',
      HttpStatus.OK,
    );
  }

  async getDriversOrders(driverId: string, isAssigned?: boolean) {
    const conditions = [eq(orders.driverId, driverId)];

    if (isAssigned === true) {
      conditions.push(isNotNull(orders.driverData));
    }

    if (isAssigned === false) {
      conditions.push(isNull(orders.driverData));
    }

    const driverOrders = await db
      .select({
        id: orders.id,
        referenceNumber: orders.referenceNumber,
        orderStatus: orders.orderStatus,
        driverId: orders.driverId,
        driverAssignedAt: orders.driverAssignedAt,
        driverData: orders.driverData,
        userData: orders.userData,
        locationData: orders.locationData,
        willDeliverAt: orders.willDeliverAt,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(and(...conditions))
      .orderBy(desc(orders.createdAt));

    return successResponse(driverOrders, 'Driver orders retrieved successfully', HttpStatus.OK);
  }

  /**
   * Admin view of a driver's full order history across all statuses (paginated).
   * Optional status/search/sort filters.
   */
  async getDriverOrdersHistory(driverId: string, query: GetDriverOrdersHistoryQueryDto) {
    const [driver] = await db
      .select({ id: admins.id, role: admins.role })
      .from(admins)
      .where(eq(admins.id, driverId))
      .limit(1);

    if (!driver || driver.role !== 'driver') {
      throw new NotFoundException('routes.driver.not_found');
    }

    const page = query.page ?? PAGINATION_DEFAULTS.PAGE;
    const limit = query.limit ?? PAGINATION_DEFAULTS.LIMIT;
    const offset = (page - 1) * limit;
    const sortDir = query.sort ?? 'desc';

    const conditions: SQL[] = [eq(orders.driverId, driverId)];
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

    const driverOrders = await db
      .select({
        id: orders.id,
        referenceNumber: orders.referenceNumber,
        orderStatus: orders.orderStatus,
        driverId: orders.driverId,
        driverAssignedAt: orders.driverAssignedAt,
        driverData: orders.driverData,
        userData: orders.userData,
        locationData: orders.locationData,
        willDeliverAt: orders.willDeliverAt,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .where(where)
      .orderBy(sortDir === 'asc' ? asc(orders.createdAt) : desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    return successResponse(
      {
        items: driverOrders,
        pagination: {
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
          page,
          limit,
        },
      },
      'Driver orders retrieved successfully',
      HttpStatus.OK,
    );
  }

  async acceptOrder(orderId: string, driverId: string) {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      throw new NotFoundException('routes.orders.not_found');
    }

    if (order.driverId !== driverId) {
      throw new BadRequestException('routes.orders.not_assigned_to_driver');
    }

    if (!order.driverAssignedAt) {
      throw new BadRequestException('routes.orders.driver_assignment_missing');
    }

    if (
      order.orderStatus === 'delivered' ||
      order.orderStatus === 'cancelled' ||
      order.orderStatus === 'out_for_delivery'
    ) {
      throw new BadRequestException('routes.orders.accept_invalid_state');
    }

    const [driver] = await db
      .select({
        id: admins.id,
        role: admins.role,
        name: admins.name,
        profileImage: admins.profileImage,
        phoneNumber: admins.phoneNumber,
      })
      .from(admins)
      .where(eq(admins.id, driverId))
      .limit(1);

    if (!driver || driver.role !== 'driver') {
      throw new NotFoundException('routes.driver.not_found');
    }

    /*
      Acceptance always records driverData (admins see the assigned driver right away).
      If the order is already 'ready', accepting sends it out for delivery immediately.
      Otherwise the status is left untouched; the order flips to 'out_for_delivery'
      automatically once the bakery marks it 'ready' (see OrderService.changeStatus).
    */
    const isReady = order.orderStatus === 'ready';

    const [updatedOrder] = await db
      .update(orders)
      .set({
        driverData: {
          name: driver.name || 'Driver',
          profileImage: driver.profileImage || '',
          phoneNumber: driver.phoneNumber || '',
        },
        ...(isReady ? { orderStatus: 'out_for_delivery' as const } : {}),
      })
      .where(eq(orders.id, orderId))
      .returning({
        id: orders.id,
        driverId: orders.driverId,
        driverAssignedAt: orders.driverAssignedAt,
        driverData: orders.driverData,
        orderStatus: orders.orderStatus,
      });

    // Only the order going out for delivery now warrants notifying the customer.
    // The driver took this action themselves, so they don't need a notification.
    if (isReady && order.userId) {
      await this.notificationService.pushNotificationSafe({
        titleKey: 'notification_templates.order_status.out_for_delivery.title',
        bodyKey: 'notification_templates.order_status.out_for_delivery.body',
        args: { ref: order.referenceNumber ?? '' },
        type: 'order_status',
        recipientType: 'user',
        recipientId: order.userId,
        redirectId: orderId,
        data: { orderId, status: 'out_for_delivery' },
      });
    }

    return successResponse(updatedOrder, 'Order accepted successfully', HttpStatus.OK);
  }

  async refuseOrder(orderId: string, driverId: string) {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);

    if (!order) {
      throw new NotFoundException('routes.orders.not_found');
    }

    if (order.driverId !== driverId) {
      throw new BadRequestException('routes.orders.not_assigned_to_driver');
    }

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
        orderStatus: orders.orderStatus,
      });

    // The order just lost its driver — alert admins so they can reassign it
    // instead of letting it sit driver-less. Fire-and-forget.
    await this.notificationService.pushToPlatformAdmins({
      titleKey: 'notification_templates.order_needs_driver.title',
      bodyKey: 'notification_templates.order_needs_driver.body',
      args: { ref: order.referenceNumber ?? orderId },
      type: 'order_update',
      redirectId: orderId,
      data: { orderId, event: 'driver_refused' },
    });

    return successResponse(updatedOrder, 'Order refused successfully', HttpStatus.OK);
  }

  async updateDriverDueAmount(id: string, dueAmount: number) {
    const driver = await db.query.admins.findFirst({
      where: eq(admins.id, id),
    });

    if (!driver || driver.role !== 'driver') {
      throw new NotFoundException('routes.driver.not_found');
    }

    const [updatedDriver] = await db
      .update(admins)
      .set({
        dueAmount: dueAmount.toString(),
        updatedAt: new Date(),
      })
      .where(eq(admins.id, id))
      .returning({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        role: admins.role,
        phoneNumber: admins.phoneNumber,
        dueAmount: admins.dueAmount,
        profileImage: admins.profileImage,
        bakeryId: admins.bakeryId,
        regionId: admins.regionId,
        isBlocked: admins.isBlocked,
        blockedAt: admins.blockedAt,
        createdAt: admins.createdAt,
        updatedAt: admins.updatedAt,
      });

    // Let the driver know their balance changed. Fire-and-forget: a failed push
    // must never fail the update itself.
    await this.notificationService.pushNotificationSafe({
      titleKey: 'notification_templates.due_amount_updated.title',
      bodyKey: 'notification_templates.due_amount_updated.body',
      args: { amount: dueAmount },
      type: 'system',
      recipientType: 'admin',
      recipientId: updatedDriver.id,
      data: { dueAmount: String(dueAmount) },
    });

    return successResponse(
      this.mapDriverData(updatedDriver),
      'Driver due amount updated successfully',
      HttpStatus.OK,
    );
  }

  private mapDriverData(driver: {
    id: string;
    name: string | null;
    email: string;
    role: 'super_admin' | 'admin' | 'manager' | 'driver';
    phoneNumber: string | null;
    dueAmount: string;
    profileImage: string | null;
    bakeryId: string | null;
    regionId: string | null;
    isBlocked: boolean;
    blockedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): DriverDataDto {
    return {
      id: driver.id,
      name: driver.name || undefined,
      email: driver.email,
      phoneNumber: driver.phoneNumber || undefined,
      dueAmount: Number(driver.dueAmount),
      role: driver.role as 'driver',
      profileImage: driver.profileImage,
      bakeryId: driver.bakeryId,
      regionId: driver.regionId,
      isBlocked: driver.isBlocked,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }
}
