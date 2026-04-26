import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { notifications, users, admins } from '@/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { SendNotificationDto, PaginationDto, NotificationResponse, NotificationType } from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { FirebaseService } from '@/common/services';

export type RecipientKind = 'user' | 'admin';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async registerFcmToken(
    recipientKind: RecipientKind,
    recipientId: string,
    fcmToken: string,
  ): Promise<SuccessResponse<{ message: string }>> {
    try {
      if (recipientKind === 'user') {
        const [updated] = await db
          .update(users)
          .set({ fcmToken, updatedAt: new Date() })
          .where(eq(users.id, recipientId))
          .returning({ id: users.id });

        if (!updated) {
          throw new NotFoundException(
            errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
          );
        }
      } else {
        const [updated] = await db
          .update(admins)
          .set({ fcmToken, updatedAt: new Date() })
          .where(eq(admins.id, recipientId))
          .returning({ id: admins.id });

        if (!updated) {
          throw new NotFoundException(
            errorResponse('Admin not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
          );
        }
      }

      this.logger.log(`FCM token registered for ${recipientKind} ${recipientId}`);

      return successResponse(
        { message: 'FCM token registered successfully' },
        'FCM token registered successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to register FCM token: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to register FCM token',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async clearFcmToken(
    recipientKind: RecipientKind,
    recipientId: string,
  ): Promise<SuccessResponse<{ message: string }>> {
    try {
      if (recipientKind === 'user') {
        await db
          .update(users)
          .set({ fcmToken: null, updatedAt: new Date() })
          .where(eq(users.id, recipientId));
      } else {
        await db
          .update(admins)
          .set({ fcmToken: null, updatedAt: new Date() })
          .where(eq(admins.id, recipientId));
      }

      this.logger.log(`FCM token cleared for ${recipientKind} ${recipientId}`);

      return successResponse(
        { message: 'FCM token cleared successfully' },
        'FCM token cleared successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to clear FCM token: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to clear FCM token',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async sendNotification(dto: SendNotificationDto): Promise<SuccessResponse<NotificationResponse>> {
    const { title, body, type, recipientType, recipientId, redirectId, data } = dto;

    let fcmToken: string | null = null;

    if (recipientType === 'user') {
      const [user] = await db
        .select({ id: users.id, fcmToken: users.fcmToken })
        .from(users)
        .where(eq(users.id, recipientId))
        .limit(1);

      if (!user) {
        throw new NotFoundException(
          errorResponse('User not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }
      fcmToken = user.fcmToken;
    } else {
      const [admin] = await db
        .select({ id: admins.id, fcmToken: admins.fcmToken })
        .from(admins)
        .where(eq(admins.id, recipientId))
        .limit(1);

      if (!admin) {
        throw new NotFoundException(
          errorResponse('Admin not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
        );
      }
      fcmToken = admin.fcmToken;
    }

    try {
      const [created] = await db
        .insert(notifications)
        .values({
          title,
          body,
          type,
          userId: recipientType === 'user' ? recipientId : null,
          adminId: recipientType === 'admin' ? recipientId : null,
          redirectId: redirectId ?? null,
        })
        .returning();

      this.logger.log(
        `Notification ${created.id} stored for ${recipientType} ${recipientId} (type=${type})`,
      );

      if (fcmToken) {
        const pushPayload: Record<string, string> = {
          notificationId: created.id,
          type,
          ...(created.redirectId ? { redirectId: created.redirectId } : {}),
          ...(data ?? {}),
        };

        const result = await this.firebaseService.sendToToken(fcmToken, title, body, pushPayload);

        if (!result.success && result.invalidToken) {
          this.logger.warn(`Clearing invalid FCM token for ${recipientType} ${recipientId}`);
          if (recipientType === 'user') {
            await db
              .update(users)
              .set({ fcmToken: null, updatedAt: new Date() })
              .where(eq(users.id, recipientId));
          } else {
            await db
              .update(admins)
              .set({ fcmToken: null, updatedAt: new Date() })
              .where(eq(admins.id, recipientId));
          }
        }
      } else {
        this.logger.debug(
          `No FCM token registered for ${recipientType} ${recipientId} — push skipped`,
        );
      }

      return successResponse(
        this.formatNotificationResponse(created),
        'Notification sent successfully',
        HttpStatus.CREATED,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send notification: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to send notification',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async findAllForRecipient(
    recipientKind: RecipientKind,
    recipientId: string,
    pagination: PaginationDto,
    filters: { isRead?: boolean; type?: NotificationType },
  ) {
    try {
      const page = pagination.page ?? 1;
      const limit = pagination.limit ?? 10;
      const offset = (page - 1) * limit;

      const recipientCondition =
        recipientKind === 'user'
          ? eq(notifications.userId, recipientId)
          : eq(notifications.adminId, recipientId);

      const conditions = [recipientCondition];
      if (filters.isRead !== undefined) {
        conditions.push(eq(notifications.isRead, filters.isRead));
      }
      if (filters.type !== undefined) {
        conditions.push(eq(notifications.type, filters.type));
      }

      const whereExpr = conditions.length === 1 ? conditions[0] : and(...conditions);

      const [{ count }] = await db
        .select({ count: sql<string>`COUNT(*)` })
        .from(notifications)
        .where(whereExpr);
      const total = typeof count === 'string' ? parseInt(count, 10) : count;

      const rows = await db
        .select()
        .from(notifications)
        .where(whereExpr)
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);

      this.logger.debug(
        `Retrieved notifications for ${recipientKind} ${recipientId}: page ${page}, total ${total}`,
      );

      return successResponse(
        {
          items: rows.map((n) => this.formatNotificationResponse(n)),
          pagination: { total, totalPages, page, limit },
        },
        'Notifications retrieved successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve notifications: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve notifications',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async unreadCount(
    recipientKind: RecipientKind,
    recipientId: string,
  ): Promise<SuccessResponse<{ unreadCount: number }>> {
    try {
      const recipientCondition =
        recipientKind === 'user'
          ? eq(notifications.userId, recipientId)
          : eq(notifications.adminId, recipientId);

      const [{ count }] = await db
        .select({ count: sql<string>`COUNT(*)` })
        .from(notifications)
        .where(and(recipientCondition, eq(notifications.isRead, false)));

      const unreadCount = typeof count === 'string' ? parseInt(count, 10) : count;

      return successResponse({ unreadCount }, 'Unread count retrieved successfully', HttpStatus.OK);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get unread count: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to retrieve unread count',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async markAsRead(
    id: string,
    recipientKind: RecipientKind,
    recipientId: string,
  ): Promise<SuccessResponse<NotificationResponse>> {
    const [existing] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(
        errorResponse('Notification not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.assertOwnership(existing, recipientKind, recipientId);

    try {
      const [updated] = await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.id, id))
        .returning();

      this.logger.log(`Notification ${id} marked as read by ${recipientKind} ${recipientId}`);

      return successResponse(
        this.formatNotificationResponse(updated),
        'Notification marked as read',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to mark notification as read: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to mark notification as read',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async markAllAsRead(
    recipientKind: RecipientKind,
    recipientId: string,
  ): Promise<SuccessResponse<{ message: string }>> {
    try {
      const recipientCondition =
        recipientKind === 'user'
          ? eq(notifications.userId, recipientId)
          : eq(notifications.adminId, recipientId);

      const updatedRows = await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(recipientCondition, eq(notifications.isRead, false)))
        .returning({ id: notifications.id });

      const message = `${updatedRows.length} notifications marked as read`;
      this.logger.log(`${recipientKind} ${recipientId}: ${message}`);

      return successResponse({ message }, 'All notifications marked as read', HttpStatus.OK);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to mark all as read: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to mark notifications as read',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async remove(
    id: string,
    recipientKind: RecipientKind,
    recipientId: string,
  ): Promise<SuccessResponse<{ message: string }>> {
    const [existing] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException(
        errorResponse('Notification not found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.assertOwnership(existing, recipientKind, recipientId);

    try {
      await db.delete(notifications).where(eq(notifications.id, id));
      this.logger.log(`Notification ${id} deleted by ${recipientKind} ${recipientId}`);

      return successResponse(
        { message: 'Notification deleted successfully' },
        'Notification deleted successfully',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete notification: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'Failed to delete notification',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  private assertOwnership(
    notification: { userId: string | null; adminId: string | null },
    recipientKind: RecipientKind,
    recipientId: string,
  ): void {
    const ownerId = recipientKind === 'user' ? notification.userId : notification.adminId;
    if (ownerId !== recipientId) {
      throw new ForbiddenException(
        errorResponse(
          'You do not have access to this notification',
          HttpStatus.FORBIDDEN,
          'ForbiddenException',
        ),
      );
    }
  }

  private formatNotificationResponse(n: {
    id: string;
    title: string;
    body: string;
    type: NotificationType;
    userId: string | null;
    adminId: string | null;
    redirectId: string | null;
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
  }): NotificationResponse {
    return {
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      userId: n.userId,
      adminId: n.adminId,
      redirectId: n.redirectId,
      isRead: n.isRead,
      readAt: n.readAt,
      createdAt: n.createdAt,
    };
  }
}
