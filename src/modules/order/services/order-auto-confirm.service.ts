import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, isNotNull, lt } from 'drizzle-orm';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { NotificationService } from '@/modules/notification/services/notification.service';
import { BAKERY_ASSIGNMENT_RESPONSE_WINDOW_MS } from '@/constants/global.constants';

/**
 * A bakery has one hour from `assigningDate` to accept or decline an order it
 * was assigned (the same window `unassignFromBakery` enforces for declining).
 * Staying silent past that window is treated as acceptance, so the order can't
 * sit in `pending` forever while its delivery date approaches.
 *
 * The same rule is also applied opportunistically in `OrderService` when a
 * bakery lists its orders; this cron is what guarantees it happens for bakeries
 * that never open the dashboard.
 */
@Injectable()
export class OrderAutoConfirmService {
  private readonly logger = new Logger(OrderAutoConfirmService.name);

  /** Guards against a slow run overlapping the next tick on the same instance. */
  private isRunning = false;

  constructor(private readonly notificationService: NotificationService) {}

  @Cron(CronExpression.EVERY_10_MINUTES, { name: 'auto-confirm-assigned-orders' })
  async handleCron(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Previous auto-confirm run is still in progress, skipping this tick');
      return;
    }

    this.isRunning = true;
    try {
      await this.autoConfirmStaleAssignments();
    } catch (error) {
      // A cron throwing would be an unhandled rejection — swallow and log.
      this.logger.error(
        `Auto-confirm run failed: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : '',
      );
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
}
