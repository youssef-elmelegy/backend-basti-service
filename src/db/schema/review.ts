import { pgTable, timestamp, uuid, integer, text, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users, orders, bakeries } from '.';

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
