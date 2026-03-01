import {
  pgTable,
  boolean,
  timestamp,
  uuid,
  decimal,
  text,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
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
  CartTypeEnum,
} from '.';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id').references(() => users.id),
    userData: jsonb('user_data').$type<{
      email: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
    }>(),
    bakeryId: uuid('bakery_id').references(() => bakeries.id),

    locationId: uuid('location_id').references(() => locations.id),
    locationData: jsonb('location_data').$type<{
      label: string;
      latitude: number;
      longitude: number;
      buildingNo: string;
      street: string;
      description: string;
    }>(),

    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    finalPrice: decimal('final_price', { precision: 10, scale: 2 }).notNull(),

    paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
    paymentMethodType: paymentMethodTypeEnum('payment_method_type').notNull(),
    paymentData: jsonb('payment_data').$type<{
      type: string;
      cardHolderName: string;
      cardLastFourDigits: string;
      cardExpiryMonth: number;
      cardExpiryYear: number;
    }>(),

    orderStatus: orderStatusEnum('order_status').default('pending').notNull(),
    deliveryNote: text('delivery_note'),
    keepAnonymous: boolean('keep_anonymous').default(false).notNull(),
    cartType: CartTypeEnum('type').notNull(),

    cardMessage: jsonb('card_message').$type<{
      to: string;
      from: string;
      message: string;
      link: string;
    }>(),

    recipientData: jsonb('recipient_data').$type<{
      name: string;
      email: string;
      phoneNumber: string;
    }>(),

    wantedDeliveryDate: timestamp('wanted_delivery_date', { mode: 'date' }),
    wantedDeliveryTimeSlot: jsonb('wanted_delivery_time_slot').$type<{
      from: string;
      to: string;
    }>(),
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
