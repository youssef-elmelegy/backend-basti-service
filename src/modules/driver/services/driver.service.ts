import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '@/db';
import { admins } from '@/db/schema';
import { successResponse, SuccessResponse } from '@/utils';
import { DriverDataDto } from '../dto';
import { orders, reports, users } from '@/db/schema';
import { CreateReportDto } from '../dto';

@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);

  async findAll(): Promise<SuccessResponse<DriverDataDto[]>> {
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
        isBlocked: admins.isBlocked,
        blockedAt: admins.blockedAt,
        createdAt: admins.createdAt,
        updatedAt: admins.updatedAt,
      })
      .from(admins)
      .where(eq(admins.role, 'driver'))
      .orderBy(asc(admins.createdAt));

    this.logger.debug(`Retrieved ${drivers.length} drivers`);

    return successResponse(
      drivers.map((driver) => this.mapDriverData(driver)),
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

  async getAllReports(driverId: string) {
    const all = await db
      .select({ report: reports, user: users })
      .from(reports)
      .innerJoin(users, eq(reports.userId, users.id))
      .where(eq(reports.driverId, driverId))
      .orderBy(asc(reports.createdAt));

    const mapped = all.map((r) => ({
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

    return successResponse(mapped, 'Reports retrieved successfully', HttpStatus.OK);
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

    const assignmentAgeMs = Date.now() - new Date(order.driverAssignedAt).getTime();
    if (assignmentAgeMs > 30 * 60 * 1000) {
      throw new BadRequestException('routes.orders.driver_assignment_expired');
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

    const [updatedOrder] = await db
      .update(orders)
      .set({
        driverData: {
          name: driver.name || 'Driver',
          profileImage: driver.profileImage || '',
          phoneNumber: driver.phoneNumber || '',
        },
        orderStatus: 'out_for_delivery',
      })
      .where(eq(orders.id, orderId))
      .returning({
        id: orders.id,
        driverId: orders.driverId,
        driverAssignedAt: orders.driverAssignedAt,
        driverData: orders.driverData,
        orderStatus: orders.orderStatus,
      });

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
        isBlocked: admins.isBlocked,
        blockedAt: admins.blockedAt,
        createdAt: admins.createdAt,
        updatedAt: admins.updatedAt,
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
      isBlocked: driver.isBlocked,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }
}
