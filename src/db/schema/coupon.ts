import { 
	pgTable, 
	varchar, 
	timestamp, 
	uuid, 
	text, 
	index, 
	jsonb, 
	decimal, 
	boolean, 
	integer, 
  uniqueIndex,
  primaryKey
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { discountType, orders, regions, users } from '.';
import { TranslationObject, DEFAULT_TRANSLATION_OBJECT } from '@/types/translation.types';

export const coupons = pgTable(
  'coupons',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    code: varchar('code', { length: 255 }).unique().notNull(),

    name: jsonb('name').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),

    discountType: discountType('discount_type').notNull(),
    discountValue: decimal('discount_value', { precision: 10, scale: 2 }).default('0').notNull(),
    minOrderValue: integer('min_order_value'),

    startDate: timestamp('start_date', { mode: 'date' }),
    expiryDate: timestamp('expiry_date', { mode: 'date' }),

    usageLimitGlobal: integer('usage_limit_global').default(0).notNull(),
    usageLimitPerUser: integer('usage_limit_per_user').default(0).notNull(),

    regionId: uuid('region_id').references(() => regions.id),

    isGlobal: boolean('is_global').default(true).notNull(),
    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex('coupon_code_idx').on(table.code),
    activeDatesIdx: index('coupon_active_dates_idx').on(table.isActive, table.startDate, table.expiryDate),
  })
);

export const couponUsages = pgTable(
  'coupon_usages', 
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    couponId: uuid('coupon_id').references(() => coupons.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    orderId: uuid('order_id').references(() => orders.id).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userCouponIdx: index('coupon_usages_user_coupon_idx').on(table.userId, table.couponId),
    globalCouponIdx: index('coupon_usages_global_coupon_idx').on(table.couponId),
    uniqueOrderCouponIdx: uniqueIndex('unique_order_coupon_idx').on(table.orderId, table.couponId),
  })
);

export const couponsRelations = relations(coupons, ({ one, many }) => ({
  usages: many(couponUsages),
  regions: one(regions, {
    fields: [coupons.regionId],
    references: [regions.id],
  }),
}));

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsages.couponId],
    references: [coupons.id],
  }),
  user: one(users, {
    fields: [couponUsages.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [couponUsages.orderId],
    references: [orders.id],
  }),
}));