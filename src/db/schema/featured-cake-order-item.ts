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
import { orderItems } from '.';

export const featuredCakeOrderItems = pgTable(
  'featured_cake_order_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    images: jsonb('images').notNull().$type<string[]>(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    capacity: integer('capacity').notNull(),
    options: jsonb('options').notNull().$type<
      Array<{
        flavor: string;
        pipingPalette: string;
      }>
    >(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('featured_cake_order_items_name_idx').on(table.name),
    isActiveIdx: index('featured_cake_order_items_is_active_idx').on(table.isActive),
  }),
);

export const featuredCakeOrderItemsRelations = relations(featuredCakeOrderItems, ({ many }) => ({
  orderItems: many(orderItems),
}));
