import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  uuid,
  integer,
  decimal,
  text,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import {
  orderStatusEnum,
  paymentMethodTypeEnum,
  bakeries,
  users,
  locations,
  paymentMethods,
  cakes,
  addons,
  reviews,
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

// TODO: we need to seperate this table in another file
export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    cakeId: uuid('cake_id').references(() => cakes.id),
    addonId: uuid('addon_id').references(() => addons.id),

    quantity: integer('quantity').notNull().default(1),
    size: varchar('size', { length: 50 }),
    flavor: varchar('flavor', { length: 100 }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),

    selectedOptions: jsonb('selected_options').$type<
      Array<{
        optionId: string;
        type: string;
        label: string;
        value: string;
      }>
    >(),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
  }),
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  cake: one(cakes, {
    fields: [orderItems.cakeId],
    references: [cakes.id],
  }),
  addon: one(addons, {
    fields: [orderItems.addonId],
    references: [addons.id],
  }),
}));
