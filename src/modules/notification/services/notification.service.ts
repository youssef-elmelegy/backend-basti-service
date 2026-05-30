import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { db } from '@/db';
import { notifications, users, admins, bakeries } from '@/db/schema';
import { and, desc, eq, getTableColumns, inArray, or, sql } from 'drizzle-orm';
import {
  SendNotificationDto,
  BroadcastNotificationDto,
  PaginationDto,
  NotificationResponse,
  NotificationType,
} from '../dto';
import { errorResponse, successResponse, SuccessResponse } from '@/utils';
import { FirebaseService } from '@/common/services';
import { TranslationService } from '@/common';

export type RecipientKind = 'user' | 'admin';

export interface PushNotificationParams {
  title: string;
  body: string;
  type: NotificationType;
  recipientType: RecipientKind;
  recipientId: string;
  redirectId?: string | null;
  data?: Record<string, string>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly translationService: TranslationService,
  ) {}

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
            errorResponse(
              'routes.notifications.user_not_found',
              HttpStatus.NOT_FOUND,
              'NotFoundException',
            ),
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
            errorResponse(
              'routes.notifications.admin_not_found',
              HttpStatus.NOT_FOUND,
              'NotFoundException',
            ),
          );
        }
      }

      this.logger.log(`FCM token registered for ${recipientKind} ${recipientId}`);

      return successResponse(
        { message: 'routes.notifications.fcm_token_registered' },
        'routes.notifications.fcm_token_registered',
        HttpStatus.OK,
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to register FCM token: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.notifications.failed_register_fcm',
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
        { message: 'routes.notifications.fcm_token_cleared' },
        'routes.notifications.fcm_token_cleared',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to clear FCM token: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.notifications.failed_clear_fcm',
          HttpStatus.INTERNAL_SERVER_ERROR,
          'InternalServerError',
        ),
      );
    }
  }

  async sendNotification(dto: SendNotificationDto): Promise<SuccessResponse<NotificationResponse>> {
    const created = await this.pushNotification(dto);
    return successResponse(
      this.formatNotificationResponse(created),
      'routes.notifications.sent',
      HttpStatus.CREATED,
    );
  }

  /**
   * Internal helper used by other services to persist a notification and
   * deliver an FCM push in one call. Throws NotFoundException only if the
   * recipient does not exist; otherwise it logs and swallows push failures
   * so the caller's primary action is never disrupted by a push error.
   */
  async pushNotification(params: PushNotificationParams): Promise<{
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
  }> {
    const { title, body, type, recipientType, recipientId, redirectId, data } = params;

    let fcmToken: string | null = null;

    if (recipientType === 'user') {
      const [user] = await db
        .select({ id: users.id, fcmToken: users.fcmToken })
        .from(users)
        .where(eq(users.id, recipientId))
        .limit(1);

      if (!user) {
        throw new NotFoundException(
          errorResponse(
            'routes.notifications.user_not_found',
            HttpStatus.NOT_FOUND,
            'NotFoundException',
          ),
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
          errorResponse(
            'routes.notifications.admin_not_found',
            HttpStatus.NOT_FOUND,
            'NotFoundException',
          ),
        );
      }
      fcmToken = admin.fcmToken;
    }

    const titleObject = { ar: title, en: title };
    const bodyObject = { ar: body, en: body };

    const [created] = await db
      .insert(notifications)
      .values({
        title: titleObject,
        body: bodyObject,
        type,
        userId: recipientType === 'user' ? recipientId : null,
        adminId: recipientType === 'admin' ? recipientId : null,
        redirectId: redirectId ?? null,
      })
      .returning({
        ...getTableColumns(notifications),
        title: this.translationService.getLocalized(notifications.title, 'title'),
        body: this.translationService.getLocalized(notifications.body, 'body'),
      });

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

      try {
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
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        this.logger.warn(
          `Non-fatal FCM push failure for ${recipientType} ${recipientId}: ${errMsg}`,
        );
      }
    } else {
      this.logger.debug(
        `No FCM token registered for ${recipientType} ${recipientId} — push skipped`,
      );
    }

    return created;
  }

  /**
   * Fire-and-forget variant of pushNotification. Catches all errors and logs
   * them so callers (order/review/coupon/offer flows) don't have to wrap each
   * call in try/catch — the primary business action stays unaffected.
   */
  async pushNotificationSafe(params: PushNotificationParams): Promise<void> {
    try {
      await this.pushNotification(params);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to deliver ${params.type} notification to ${params.recipientType} ${params.recipientId}: ${errMsg}`,
      );
    }
  }

  /**
   * Fan-out push to every admin staffing a given bakery (manager + any other
   * bakery-scoped admin). Returns silently if the bakery has no staff.
   */
  async pushToBakeryStaff(
    bakeryId: string,
    payload: Omit<PushNotificationParams, 'recipientType' | 'recipientId'>,
  ): Promise<void> {
    try {
      const bakeryAdmins = await db
        .select({ id: admins.id })
        .from(admins)
        .where(and(eq(admins.bakeryId, bakeryId), eq(admins.isBlocked, false)));

      const [bakery] = await db
        .select({ managerId: bakeries.managerId })
        .from(bakeries)
        .where(eq(bakeries.id, bakeryId))
        .limit(1);

      const ids = new Set<string>();
      for (const a of bakeryAdmins) ids.add(a.id);
      if (bakery?.managerId) ids.add(bakery.managerId);

      if (ids.size === 0) {
        this.logger.debug(`Bakery ${bakeryId} has no admins to notify`);
        return;
      }

      await Promise.all(
        Array.from(ids).map((adminId) =>
          this.pushNotificationSafe({
            ...payload,
            recipientType: 'admin',
            recipientId: adminId,
          }),
        ),
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to push to bakery staff (${bakeryId}): ${errMsg}`);
    }
  }

  /**
   * Fan-out push to every platform-level admin (super_admin / admin), used
   * for new orders, cancellations, and other events admins must oversee.
   */
  async pushToPlatformAdmins(
    payload: Omit<PushNotificationParams, 'recipientType' | 'recipientId'>,
  ): Promise<void> {
    try {
      const rows = await db
        .select({ id: admins.id })
        .from(admins)
        .where(
          and(
            eq(admins.isBlocked, false),
            or(eq(admins.role, 'super_admin'), eq(admins.role, 'admin')),
          ),
        );

      if (rows.length === 0) {
        this.logger.debug('No platform admins to notify');
        return;
      }

      await Promise.all(
        rows.map((a) =>
          this.pushNotificationSafe({
            ...payload,
            recipientType: 'admin',
            recipientId: a.id,
          }),
        ),
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to push to platform admins: ${errMsg}`);
    }
  }

  /**
   * Fan-out push to super_admin accounts only — used when an event must reach
   * the top-level main admins and not the wider admin pool.
   */
  async pushToSuperAdmins(
    payload: Omit<PushNotificationParams, 'recipientType' | 'recipientId'>,
  ): Promise<void> {
    try {
      const rows = await db
        .select({ id: admins.id })
        .from(admins)
        .where(and(eq(admins.isBlocked, false), eq(admins.role, 'super_admin')));

      if (rows.length === 0) {
        this.logger.debug('No super admins to notify');
        return;
      }

      await Promise.all(
        rows.map((a) =>
          this.pushNotificationSafe({
            ...payload,
            recipientType: 'admin',
            recipientId: a.id,
          }),
        ),
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to push to super admins: ${errMsg}`);
    }
  }

  /**
   * Broadcast to every user (used for offers, coupons and other promotional
   * messages). Stores a row per user and pushes to those with FCM tokens.
   */
  async broadcastToAllUsers(
    payload: Omit<PushNotificationParams, 'recipientType' | 'recipientId'>,
  ): Promise<{ totalUsers: number; pushedCount: number; failedCount: number }> {
    try {
      const allUsers = await db.select({ id: users.id, fcmToken: users.fcmToken }).from(users);

      if (allUsers.length === 0) {
        return { totalUsers: 0, pushedCount: 0, failedCount: 0 };
      }

      const titleObject = { ar: payload.title, en: payload.title };
      const bodyObject = { ar: payload.body, en: payload.body };

      await db.insert(notifications).values(
        allUsers.map((u) => ({
          title: titleObject,
          body: bodyObject,
          type: payload.type,
          userId: u.id,
          adminId: null,
          redirectId: payload.redirectId ?? null,
        })),
      );

      const withToken = allUsers.filter((u): u is { id: string; fcmToken: string } =>
        Boolean(u.fcmToken),
      );

      let pushedCount = 0;
      let failedCount = 0;
      const invalidTokenUserIds: string[] = [];

      const pushPayloadBase: Record<string, string> = {
        type: payload.type,
        ...(payload.redirectId ? { redirectId: payload.redirectId } : {}),
        ...(payload.data ?? {}),
      };

      await Promise.all(
        withToken.map(async (u) => {
          try {
            const result = await this.firebaseService.sendToToken(
              u.fcmToken,
              payload.title,
              payload.body,
              pushPayloadBase,
            );
            if (result.success) {
              pushedCount += 1;
            } else {
              failedCount += 1;
              if (result.invalidToken) invalidTokenUserIds.push(u.id);
            }
          } catch {
            failedCount += 1;
          }
        }),
      );

      if (invalidTokenUserIds.length > 0) {
        await db
          .update(users)
          .set({ fcmToken: null, updatedAt: new Date() })
          .where(inArray(users.id, invalidTokenUserIds));
      }

      this.logger.log(
        `Broadcast ${payload.type}: ${pushedCount} delivered, ${failedCount} failed (${allUsers.length} total)`,
      );

      return { totalUsers: allUsers.length, pushedCount, failedCount };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Broadcast push failure: ${errMsg}`);
      return { totalUsers: 0, pushedCount: 0, failedCount: 0 };
    }
  }

  async sendBroadcastNotification(
    dto: BroadcastNotificationDto,
  ): Promise<SuccessResponse<{ totalUsers: number; pushedCount: number; failedCount: number }>> {
    const { title, body, type, redirectId, data } = dto;

    try {
      const [allUsers, allAdmins] = await Promise.all([
        db.select({ id: users.id, fcmToken: users.fcmToken }).from(users),
        db
          .select({ id: admins.id, fcmToken: admins.fcmToken })
          .from(admins)
          .where(eq(admins.isBlocked, false)),
      ]);

      if (allUsers.length === 0 && allAdmins.length === 0) {
        this.logger.warn('Broadcast requested but no users or admins exist');
        return successResponse(
          { totalUsers: 0, pushedCount: 0, failedCount: 0 },
          'routes.notifications.broadcast_sent',
          HttpStatus.OK,
        );
      }

      const titleObject = { ar: title, en: title };
      const bodyObject = { ar: body, en: body };

      const notificationRows = [
        ...allUsers.map((u) => ({
          title: titleObject,
          body: bodyObject,
          type,
          userId: u.id,
          adminId: null,
          redirectId: redirectId ?? null,
        })),
        ...allAdmins.map((a) => ({
          title: titleObject,
          body: bodyObject,
          type,
          userId: null,
          adminId: a.id,
          redirectId: redirectId ?? null,
        })),
      ];

      if (notificationRows.length > 0) {
        await db.insert(notifications).values(notificationRows);
      }

      this.logger.log(
        `Broadcast notification stored for ${allUsers.length} users + ${allAdmins.length} admins (type=${type})`,
      );

      const usersWithToken = allUsers.filter((u): u is { id: string; fcmToken: string } =>
        Boolean(u.fcmToken),
      );
      const adminsWithToken = allAdmins.filter((a): a is { id: string; fcmToken: string } =>
        Boolean(a.fcmToken),
      );

      let pushedCount = 0;
      let failedCount = 0;
      const invalidTokenUserIds: string[] = [];
      const invalidTokenAdminIds: string[] = [];

      const pushPayloadBase: Record<string, string> = {
        type,
        ...(redirectId ? { redirectId } : {}),
        ...(data ?? {}),
      };

      await Promise.all([
        ...usersWithToken.map(async (u) => {
          try {
            const result = await this.firebaseService.sendToToken(
              u.fcmToken,
              title,
              body,
              pushPayloadBase,
            );

            if (result.success) {
              pushedCount += 1;
            } else {
              failedCount += 1;
              if (result.invalidToken) {
                invalidTokenUserIds.push(u.id);
              }
            }
          } catch (err) {
            failedCount += 1;
            const errMsg = err instanceof Error ? err.message : String(err);
            this.logger.warn(`FCM push failed for user ${u.id}: ${errMsg}`);
          }
        }),
        ...adminsWithToken.map(async (a) => {
          try {
            const result = await this.firebaseService.sendToToken(
              a.fcmToken,
              title,
              body,
              pushPayloadBase,
            );

            if (result.success) {
              pushedCount += 1;
            } else {
              failedCount += 1;
              if (result.invalidToken) {
                invalidTokenAdminIds.push(a.id);
              }
            }
          } catch (err) {
            failedCount += 1;
            const errMsg = err instanceof Error ? err.message : String(err);
            this.logger.warn(`FCM push failed for admin ${a.id}: ${errMsg}`);
          }
        }),
      ]);

      if (invalidTokenUserIds.length > 0) {
        this.logger.warn(
          `Clearing ${invalidTokenUserIds.length} invalid user FCM tokens after broadcast`,
        );
        for (const userId of invalidTokenUserIds) {
          await db
            .update(users)
            .set({ fcmToken: null, updatedAt: new Date() })
            .where(eq(users.id, userId));
        }
      }

      if (invalidTokenAdminIds.length > 0) {
        this.logger.warn(
          `Clearing ${invalidTokenAdminIds.length} invalid admin FCM tokens after broadcast`,
        );
        for (const adminId of invalidTokenAdminIds) {
          await db
            .update(admins)
            .set({ fcmToken: null, updatedAt: new Date() })
            .where(eq(admins.id, adminId));
        }
      }

      const totalRecipients = allUsers.length + allAdmins.length;
      const totalWithToken = usersWithToken.length + adminsWithToken.length;

      this.logger.log(
        `Broadcast push complete: ${pushedCount} delivered, ${failedCount} failed (${totalRecipients} total recipients, ${totalWithToken} with tokens)`,
      );

      return successResponse(
        {
          totalUsers: totalRecipients,
          pushedCount,
          failedCount,
        },
        'routes.notifications.broadcast_sent',
        HttpStatus.CREATED,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send broadcast notification: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.notifications.failed_send_broadcast',
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
        .select({
          ...getTableColumns(notifications),
          title: this.translationService.getLocalized(notifications.title, 'title'),
          body: this.translationService.getLocalized(notifications.body, 'body'),
        })
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
        'routes.notifications.list_retrieved',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to retrieve notifications: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.notifications.failed_retrieve',
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

      return successResponse(
        { unreadCount },
        'routes.notifications.unread_count_retrieved',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get unread count: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.notifications.failed_unread_count',
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
        errorResponse('routes.notifications.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.assertOwnership(existing, recipientKind, recipientId);

    try {
      const [updated] = await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.id, id))
        .returning({
          ...getTableColumns(notifications),
          title: this.translationService.getLocalized(notifications.title, 'title'),
          body: this.translationService.getLocalized(notifications.body, 'body'),
        });

      this.logger.log(`Notification ${id} marked as read by ${recipientKind} ${recipientId}`);

      return successResponse(
        this.formatNotificationResponse(updated),
        'routes.notifications.marked_read',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to mark notification as read: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.notifications.failed_mark_read',
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

      return successResponse({ message }, 'routes.notifications.all_marked_read', HttpStatus.OK);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to mark all as read: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.notifications.failed_mark_all_read',
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
        errorResponse('routes.notifications.not_found', HttpStatus.NOT_FOUND, 'NotFoundException'),
      );
    }

    this.assertOwnership(existing, recipientKind, recipientId);

    try {
      await db.delete(notifications).where(eq(notifications.id, id));
      this.logger.log(`Notification ${id} deleted by ${recipientKind} ${recipientId}`);

      return successResponse(
        { message: 'routes.notifications.deleted' },
        'routes.notifications.deleted',
        HttpStatus.OK,
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete notification: ${errMsg}`);
      throw new InternalServerErrorException(
        errorResponse(
          'routes.notifications.failed_delete',
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
        errorResponse('routes.notifications.forbidden', HttpStatus.FORBIDDEN, 'ForbiddenException'),
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
