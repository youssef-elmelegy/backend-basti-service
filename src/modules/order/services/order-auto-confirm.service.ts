import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, isNotNull, lt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { NotificationService } from '@/modules/notification/services/notification.service';
import {
  BAKERY_ASSIGNMENT_RESPONSE_WINDOW_MS,
  DRIVER_ASSIGNMENT_RESPONSE_WINDOW_MS,
} from '@/constants/global.constants';

/**
 * Enforces the two one-hour response windows on an order's assignments. Silence
 * resolves each of them in opposite directions:
 *
 * - **Bakery** — one hour from `assigningDate` to accept or decline (the same
 *   window `unassignFromBakery` enforces for declining). Silence is treated as
 *   acceptance, so the order can't sit in `pending` while its delivery date
 *   approaches. Also applied opportunistically in `OrderService` when a bakery
 *   lists its orders; this cron guarantees it for bakeries that never open the
 *   dashboard.
 * - **Driver** — one hour from `driverAssignedAt` to accept. Silence releases
 *   the assignment back to the unassigned pool and alerts admins, since an
 *   order left with an unresponsive driver would simply never be delivered.
 */
@Injectable()
export class OrderAutoConfirmService {
  private readonly logger = new Logger(OrderAutoConfirmService.name);

  /** Guards against a slow run overlapping the next tick on the same instance. */
  private isRunning = false;

  constructor(private readonly notificationService: NotificationService) {}

  @Cron(CronExpression.EVERY_5_MINUTES, { name: 'auto-confirm-assigned-orders' })
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Previous auto-confirm run is still in progress, skipping this tick');
      return;
    }

    this.isRunning = true;
    try {
      // Independent sweeps — a failure in one must not skip the other.
      const results = await Promise.allSettled([
        this.autoConfirmStaleAssignments(),
        this.expireStaleDriverAssignments(),
      ]);

      // A cron throwing would be an unhandled rejection — swallow and log.
      for (const [index, result] of results.entries()) {
        if (result.status === 'rejected') {
          const sweep = index === 0 ? 'bakery auto-confirm' : 'driver assignment expiry';
          const reason: unknown = result.reason;
          const message = reason instanceof Error ? reason.message : JSON.stringify(reason);
          this.logger.error(
            `${sweep} sweep failed: ${message}`,
            reason instanceof Error ? reason.stack : '',
          );
        }
      }
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Flips every order that is still `pending` more than an hour after being
   * assigned to a bakery over to `confirmed`, and tells the bakery it now owns
   * the order. Returns the ids that were confirmed.
   */
  async autoConfirmStaleAssignments(): Promise<string[]> {
    const cutoff = new Date(Date.now() - BAKERY_ASSIGNMENT_RESPONSE_WINDOW_MS);

    // The status/assigningDate predicates are repeated in the UPDATE so a bakery
    // confirming or declining between the read and the write wins over the cron.
    const confirmed = await db
      .update(orders)
      .set({ orderStatus: 'confirmed', updatedAt: new Date() })
      .where(
        and(
          eq(orders.orderStatus, 'pending'),
          isNotNull(orders.bakeryId),
          isNotNull(orders.assigningDate),
          lt(orders.assigningDate, cutoff),
        ),
      )
      .returning({
        id: orders.id,
        bakeryId: orders.bakeryId,
        referenceNumber: orders.referenceNumber,
      });

    if (confirmed.length === 0) {
      this.logger.debug('No stale bakery assignments to auto-confirm');
      return [];
    }

    this.logger.log(
      `Auto-confirmed ${confirmed.length} order(s) unanswered for over 1 hour: ${confirmed
        .map((order) => order.referenceNumber ?? order.id)
        .join(', ')}`,
    );

    // Best-effort: a failed push must never undo a committed status change.
    await Promise.all(
      confirmed.map(async (order) => {
        if (!order.bakeryId) return;

        try {
          await this.notificationService.pushToBakeryStaff(order.bakeryId, {
            titleKey: 'notification_templates.order_auto_confirmed.title',
            bodyKey: 'notification_templates.order_auto_confirmed.body',
            args: { ref: order.referenceNumber ?? order.id },
            type: 'order_status',
            redirectId: order.id,
            data: { orderId: order.id, bakeryId: order.bakeryId },
          });
        } catch (error) {
          this.logger.warn(
            `Failed to notify bakery ${order.bakeryId} about auto-confirmed order ${order.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }),
    );

    return confirmed.map((order) => order.id);
  }

  /**
   * Releases every order whose assigned driver never accepted within the window,
   * clearing the driver back to the unassigned pool and alerting admins so the
   * order gets a new one. Returns the ids that were released.
   */
  async expireStaleDriverAssignments(): Promise<string[]> {
    const cutoff = new Date(Date.now() - DRIVER_ASSIGNMENT_RESPONSE_WINDOW_MS);

    // `driverData` is the acceptance marker — it is written only by
    // `DriverService.acceptOrder`, so `IS NULL` means the driver never answered.
    // Terminal orders are excluded: clearing the driver off an order that was
    // already delivered or cancelled would destroy that history. The order
    // status is deliberately left untouched — an unaccepted assignment can
    // never have reached `out_for_delivery`, so there is nothing to roll back.
    //
    // Written as raw SQL because we need the *pre-update* `driver_id` to notify
    // the driver who lapsed: RETURNING reports post-update values, which are
    // null by then. The self-join reads the old row inside the same statement,
    // so a driver accepting concurrently still wins the race.
    const { rows: expired } = await db.execute<{
      id: string;
      reference_number: string | null;
      driver_id: string;
    }>(sql`
      UPDATE ${orders} AS o
      SET driver_id = NULL,
          driver_assigned_at = NULL,
          driver = NULL,
          updated_at = NOW()
      FROM ${orders} AS prev
      WHERE prev.id = o.id
        AND o.driver_id IS NOT NULL
        AND o.driver IS NULL
        AND o.driver_assigned_at IS NOT NULL
        AND o.driver_assigned_at < ${cutoff}
        AND o.order_status NOT IN ('delivered', 'cancelled')
      RETURNING o.id, o.reference_number, prev.driver_id
    `);

    if (expired.length === 0) {
      this.logger.debug('No stale driver assignments to expire');
      return [];
    }

    this.logger.log(
      `Expired ${expired.length} driver assignment(s) unanswered for over 1 hour: ${expired
        .map((order) => order.reference_number ?? order.id)
        .join(', ')}`,
    );

    // Best-effort: a failed push must never undo a committed release.
    await Promise.all(
      expired.map(async (order) => {
        const ref = order.reference_number ?? order.id;

        try {
          // Admins need to reassign the order.
          await this.notificationService.pushToPlatformAdmins({
            titleKey: 'notification_templates.driver_assignment_expired_admin.title',
            bodyKey: 'notification_templates.driver_assignment_expired_admin.body',
            args: { ref },
            type: 'order_update',
            redirectId: order.id,
            data: { orderId: order.id, event: 'driver_assignment_expired' },
          });

          // The driver is told the order is no longer theirs, so they don't
          // show up for a delivery that has been handed to someone else.
          await this.notificationService.pushNotificationSafe({
            titleKey: 'notification_templates.driver_assignment_expired_driver.title',
            bodyKey: 'notification_templates.driver_assignment_expired_driver.body',
            args: { ref },
            type: 'order_update',
            recipientType: 'admin',
            recipientId: order.driver_id,
            redirectId: order.id,
            data: { orderId: order.id, event: 'driver_assignment_expired' },
          });
        } catch (error) {
          this.logger.warn(
            `Failed to notify about expired driver assignment on order ${order.id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }),
    );

    return expired.map((order) => order.id);
  }
}
