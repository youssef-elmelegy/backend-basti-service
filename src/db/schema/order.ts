import {
  pgTable,
  boolean,
  timestamp,
  uuid,
  decimal,
  text,
  index,
  jsonb,
  varchar,
  integer,
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
  couponUsages,
  admins,
} from '.';

export const orders = pgTable(
  'orders',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    referenceNumber: varchar('reference_number', { length: 50 }).unique(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    userData: jsonb('user_data')
      .$type<{
        email: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
      }>()
      .notNull(),
    bakeryId: uuid('bakery_id').references(() => bakeries.id),

    // when admin assigns a driver, driverId and driverAssignedAt are stored first
    driverId: uuid('driver_id').references(() => admins.id),
    driverAssignedAt: timestamp('driver_assigned_at', { mode: 'date' }),

    /*
      if the driver responds by accepting, driverData is filled and
      orderStatus is updated to 'out_for_delivery',
      else if the driver rejects, driverId and driverAssignedAt
      is set to null and driverData remains cleared
    */
    driverData: jsonb('driver').$type<{
      name: string;
      profileImage: string;
      phoneNumber: string;
    }>(),

    deliveryCheckCodeHash: varchar('delivery_check_code_hash', { length: 255 }),
    // Kept in sync with the existing DB column (not currently read in code). Held
    // in the schema so `drizzle-kit push` doesn't try to drop it and lose data.
    deliveryCheckCodeExpiresAt: timestamp('delivery_check_code_expires_at', { mode: 'date' }),

    locationId: uuid('location_id').references(() => locations.id),
    locationData: jsonb('location_data')
      .$type<{
        label: string;
        latitude: number;
        longitude: number;
        buildingNo: string;
        street: string;
        description: string;
      }>()
      .notNull(),

    regionId: uuid('region_id').notNull(),
    regionName: varchar('region_name', { length: 100 }).notNull(),

    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    finalPrice: decimal('final_price', { precision: 10, scale: 2 }).notNull(),
    deliveryAmount: integer('delivery_amount').notNull().default(10),
    addonsTotal: integer('addons_total').notNull().default(0),
    miniCakesTotal: integer('mini_cakes_total').notNull().default(0),

    couponData: jsonb('coupon').$type<{
      id: string;
      code: string;
      name: string;
      discountType: 'percentage' | 'fixed_amount' | 'free_shipping';
      discountValue: number;
      minOrderValue?: number;
      maxDiscountValue?: number;
      startDate: Date | null;
      expiryDate: Date | null;
      usageLimitGlobal: number;
      usageLimitPerUser: number;
      isGlobal: boolean;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>(),

    bastiDeliveryAmount: integer('basti_delivery_amount').notNull().default(0),
    bastiPercentage: decimal('basti_percentage', { precision: 10, scale: 2 })
      .notNull()
      .default('0.20'),
    miniCakePercentage: decimal('mini_cake_percentage', { precision: 10, scale: 2 })
      .notNull()
      .default('0.10'),

    totalCapacity: integer('total_capacity').default(0),

    paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
    paymentMethodType: paymentMethodTypeEnum('payment_method_type'),
    paymentData: jsonb('payment_data').$type<{
      type: string;
      cardHolderName: string;
      cardLastFourDigits: string;
      cardExpiryMonth: number;
      cardExpiryYear: number;
      paymentGatewayName: string;
      paymentGatewaySubName: string;
      paymentGatewayRef: string;
    }>(),

    orderStatus: orderStatusEnum('order_status'),
    deliveryNote: text('delivery_note'),
    keepAnonymous: boolean('keep_anonymous').default(false).notNull(),
    cartType: CartTypeEnum('type').notNull(),
    assigningDate: timestamp('assigning_date', { mode: 'date' }),

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

    qa: jsonb('qa').$type<{
      finalImages: string[];
      notes: string[];
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
  driver: one(admins, {
    fields: [orders.driverId],
    references: [admins.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [orders.paymentMethodId],
    references: [paymentMethods.id],
  }),
  orderItems: many(orderItems),
  review: one(reviews),
  couponUsages: one(couponUsages, {
    fields: [orders.id],
    references: [couponUsages.orderId],
  }),
}));
