// ============================================================================
// ALL SCHEMA DEFINITIONS CONSOLIDATED
// ============================================================================

import {
  pgTable,
  pgEnum,
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

// ============================================================================
// ENUMS
// ============================================================================

export const genderEnum = pgEnum('gender_enum', ['male', 'female']);

export const adminRoleEnum = pgEnum('admin_role_enum', ['super_admin', 'admin', 'manager']);

export const bakeryTypeEnum = pgEnum('bakery_type_enum', [
  'basket_cakes',
  'medium_cakes',
  'small_cakes',
  'large_cakes',
  'custom',
]);

export const orderStatusEnum = pgEnum('order_status_enum', [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);

export const paymentMethodTypeEnum = pgEnum('payment_method_type_enum', [
  'credit_card',
  'debit_card',
  'cash',
  'wallet',
]);

export const addonCategoryEnum = pgEnum('addon_category_enum', [
  'balloons',
  'cards',
  'candles',
  'decorations',
  'other',
]);

export const addonInfoTypeEnum = pgEnum('addon_info_type_enum', [
  'color',
  'number',
  'letter',
  'text',
]);

// ============================================================================
// USERS TABLE
// ============================================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    isEmailVerified: boolean('is_email_verified').default(false).notNull(),
    phoneNumber: varchar('phone_number', { length: 20 }),
    password: varchar('password', { length: 255 }).notNull(),
    otpCode: varchar('otp_code', { length: 10 }),
    otpExpiresAt: timestamp('otp_expires_at', { mode: 'date' }),
    profileImage: text('profile_image'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    phoneNumberIdx: index('users_phone_number_idx').on(table.phoneNumber),
    emailIdx: index('users_email_idx').on(table.email),
  }),
);

export const userRelations = relations(users, ({ many }) => ({
  locations: many(locations),
  orders: many(orders),
  wishlistItems: many(wishlistItems),
  paymentMethods: many(paymentMethods),
  reviews: many(reviews),
}));

// ============================================================================
// ADMINS TABLE
// ============================================================================

export const admins = pgTable(
  'admins',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar('email', { length: 255 }).unique().notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: adminRoleEnum('role').default('admin').notNull(),
    profileImage: text('profile_image'),
    bakeryId: uuid('bakery_id'),

    otpCode: varchar('otp_code', { length: 10 }),
    otpExpiresAt: timestamp('otp_expires_at', { mode: 'date' }),

    isBlocked: boolean('is_blocked').default(false).notNull(),
    blockedAt: timestamp('blocked_at', { mode: 'date' }),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('admins_email_idx').on(table.email),
    isBlockedIdx: index('admins_is_blocked_idx').on(table.isBlocked),
    bakeryIdIdx: index('admins_bakery_id_idx').on(table.bakeryId),
  }),
);

export const adminsRelations = relations(admins, ({ one }) => ({
  bakery: one(bakeries, {
    fields: [admins.bakeryId],
    references: [bakeries.id],
  }),
}));

// ============================================================================
// REGIONS TABLE
// ============================================================================

export const regions = pgTable('regions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const regionsRelations = relations(regions, ({ many }) => ({
  bakeries: many(bakeries),
}));

// ============================================================================
// BAKERIES TABLE
// ============================================================================

export const bakeries = pgTable(
  'bakeries',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    regionId: uuid('region_id')
      .notNull()
      .references(() => regions.id),
    managerId: uuid('manager_id').references(() => admins.id),

    name: varchar('name', { length: 255 }).notNull(),
    locationDescription: text('location_description').notNull(),
    capacity: integer('capacity').notNull(), // Number of orders they can handle

    bakeryTypes: jsonb('bakery_types')
      .notNull()
      .$type<Array<'basket_cakes' | 'medium_cakes' | 'small_cakes' | 'large_cakes' | 'custom'>>(),

    averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0'),
    totalReviews: integer('total_reviews').default(0).notNull(),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    regionIdIdx: index('bakeries_region_id_idx').on(table.regionId),
    nameIdx: index('bakeries_name_idx').on(table.name),
    managerIdIdx: index('bakeries_manager_id_idx').on(table.managerId),
  }),
);

export const bakeriesRelations = relations(bakeries, ({ one, many }) => ({
  region: one(regions, {
    fields: [bakeries.regionId],
    references: [regions.id],
  }),
  manager: one(admins, {
    fields: [bakeries.managerId],
    references: [admins.id],
  }),
  chefs: many(chefs),
  orders: many(orders),
  reviews: many(reviews),
}));

// ============================================================================
// CHEFS TABLE
// ============================================================================

export const chefs = pgTable(
  'chefs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),

    fullName: varchar('full_name', { length: 255 }).notNull(),
    image: text('image'),
    specialization: varchar('specialization', { length: 255 }).notNull(),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    bakeryIdIdx: index('chefs_bakery_id_idx').on(table.bakeryId),
  }),
);

export const chefsRelations = relations(chefs, ({ one }) => ({
  bakery: one(bakeries, {
    fields: [chefs.bakeryId],
    references: [bakeries.id],
  }),
}));

// ============================================================================
// CAKES TABLE
// ============================================================================

export const cakes = pgTable(
  'cakes',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    images: jsonb('images').notNull().$type<string[]>(),
    flavors: jsonb('flavors').notNull().$type<string[]>(),
    sizes: jsonb('sizes').notNull().$type<
      Array<{
        size: string;
        price: number;
      }>
    >(), // Array of {size, price}
    mainPrice: decimal('main_price', { precision: 10, scale: 2 }).notNull(),
    tags: jsonb('tags').notNull().$type<string[]>(), // Array of tags for search
    capacity: integer('capacity').notNull(), // Number of servings
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('cakes_name_idx').on(table.name),
    isActiveIdx: index('cakes_is_active_idx').on(table.isActive),
  }),
);

export const cakesRelations = relations(cakes, ({ many }) => ({
  orderItems: many(orderItems),
  wishlistItems: many(wishlistItems),
}));

// ============================================================================
// ADDONS TABLE
// ============================================================================

export const addons = pgTable(
  'addons',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: addonCategoryEnum('category').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    images: jsonb('images').notNull().$type<string[]>(), // Array of image URLs
    tags: jsonb('tags').notNull().$type<string[]>(), // Array of tags
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('addons_name_idx').on(table.name),
    categoryIdx: index('addons_category_idx').on(table.category),
    isActiveIdx: index('addons_is_active_idx').on(table.isActive),
  }),
);

export const addonsRelations = relations(addons, ({ many }) => ({
  addonOptions: many(addonOptions),
  orderItems: many(orderItems),
  wishlistItems: many(wishlistItems),
}));

// ============================================================================
// ADDON OPTIONS TABLE
// ============================================================================

export const addonOptions = pgTable(
  'addon_options',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    addonId: uuid('addon_id')
      .notNull()
      .references(() => addons.id, { onDelete: 'cascade' }),
    type: addonInfoTypeEnum('type').notNull(), // color, number, letter, text
    label: varchar('label', { length: 100 }).notNull(), // e.g., "Red", "5", "A"
    value: varchar('value', { length: 100 }).notNull(), // The actual value
    imageUrl: text('image_url'), // Optional image for this option
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    addonIdIdx: index('addon_options_addon_id_idx').on(table.addonId),
  }),
);

export const addonOptionsRelations = relations(addonOptions, ({ one }) => ({
  addon: one(addons, {
    fields: [addonOptions.addonId],
    references: [addons.id],
  }),
}));

// ============================================================================
// ORDERS TABLE
// ============================================================================

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

    // Pricing
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
    discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
    finalPrice: decimal('final_price', { precision: 10, scale: 2 }).notNull(),

    // Payment
    paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
    paymentMethodType: paymentMethodTypeEnum('payment_method_type').notNull(),

    // Status & Delivery
    orderStatus: orderStatusEnum('order_status').default('pending').notNull(),
    deliveryNote: text('delivery_note'),
    keepAnonymous: boolean('keep_anonymous').default(false).notNull(),

    // Card Feature
    cardMessage: text('card_message'),
    cardQrCodeUrl: text('card_qr_code_url'),

    // Timestamps
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

// ============================================================================
// ORDER ITEMS TABLE
// ============================================================================

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

    // Item details
    quantity: integer('quantity').notNull().default(1),
    size: varchar('size', { length: 50 }), // For cakes
    flavor: varchar('flavor', { length: 100 }), // For cakes
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),

    // Selected addon options (if addon)
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

// ============================================================================
// PAYMENT METHODS TABLE
// ============================================================================

export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: paymentMethodTypeEnum('type').notNull(),

    // Card details (encrypted in production)
    cardHolderName: varchar('card_holder_name', { length: 255 }),
    cardLastFourDigits: varchar('card_last_four_digits', { length: 4 }),
    cardExpiryMonth: integer('card_expiry_month'),
    cardExpiryYear: integer('card_expiry_year'),

    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('payment_methods_user_id_idx').on(table.userId),
  }),
);

export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
  orders: many(orders),
}));

// ============================================================================
// LOCATIONS TABLE
// ============================================================================

export const locations = pgTable(
  'locations',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 50 }).notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
    longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
    buildingNo: varchar('building_no', { length: 50 }),
    street: varchar('street', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('locations_user_id_idx').on(table.userId),
  }),
);

export const locationsRelations = relations(locations, ({ one, many }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
  orders: many(orders),
}));

// ============================================================================
// REVIEWS TABLE
// ============================================================================

export const reviews = pgTable(
  'reviews',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id),

    rating: integer('rating').notNull(), // 1-5
    reviewText: text('review_text'),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('reviews_user_id_idx').on(table.userId),
    bakeryIdIdx: index('reviews_bakery_id_idx').on(table.bakeryId),
    orderIdIdx: index('reviews_order_id_idx').on(table.orderId),
  }),
);

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  bakery: one(bakeries, {
    fields: [reviews.bakeryId],
    references: [bakeries.id],
  }),
}));

// ============================================================================
// WISHLIST ITEMS TABLE
// ============================================================================

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cakeId: uuid('cake_id').references(() => cakes.id, { onDelete: 'cascade' }),
    addonId: uuid('addon_id').references(() => addons.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('wishlist_items_user_id_idx').on(table.userId),
    uniqueUserCake: index('wishlist_unique_user_cake_idx').on(table.userId, table.cakeId),
    uniqueUserAddon: index('wishlist_unique_user_addon_idx').on(table.userId, table.addonId),
  }),
);

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  cake: one(cakes, {
    fields: [wishlistItems.cakeId],
    references: [cakes.id],
  }),
  addon: one(addons, {
    fields: [wishlistItems.addonId],
    references: [addons.id],
  }),
}));

// ============================================================================
// SLIDER IMAGES TABLE
// ============================================================================

export const sliderImages = pgTable('slider_images', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  imageUrl: text('image_url').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const sliderImagesRelations = relations(sliderImages, () => ({}));
