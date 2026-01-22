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
import { orderItems, wishlistItems } from '.';

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
    >(),
    mainPrice: decimal('main_price', { precision: 10, scale: 2 }).notNull(),
    tags: jsonb('tags').notNull().$type<string[]>(),
    capacity: integer('capacity').notNull(),
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
