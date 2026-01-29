import { pgTable, boolean, timestamp, uuid, decimal, text, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import {
  orderStatusEnum,
  paymentMethodTypeEnum,
  bakeries,
  users,
  locations,
  paymentMethods,
  reviews,
  orderItems,
} from '.';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id),

    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    finalPrice: decimal('final_price', { precision: 10, scale: 2 }).notNull(),

    paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
    paymentMethodType: paymentMethodTypeEnum('payment_method_type').notNull(),

    orderStatus: orderStatusEnum('order_status').default('pending').notNull(),
    deliveryNote: text('delivery_note'),
    keepAnonymous: boolean('keep_anonymous').default(false).notNull(),

    cardMessage: text('card_message'),
    cardQrCodeUrl: text('card_qr_code_url'),

    willDeliverAt: timestamp('will_deliver_at', { mode: 'date' }).notNull(),
    deliveredAt: timestamp('delivered_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('orders_user_id_idx').on(table.userId),
    bakeryIdIdx: index('orders_bakery_id_idx').on(table.bakeryId),
    orderStatusIdx: index('orders_status_idx').on(table.orderStatus),
    createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
  }),
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  bakery: one(bakeries, {
    fields: [orders.bakeryId],
    references: [bakeries.id],
  }),
  location: one(locations, {
    fields: [orders.locationId],
    references: [locations.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [orders.paymentMethodId],
    references: [paymentMethods.id],
  }),
  orderItems: many(orderItems),
  review: one(reviews),
}));
