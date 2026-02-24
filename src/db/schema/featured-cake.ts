import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  uuid,
  integer,
  text,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { cartItems, tags } from '.';

export const featuredCakes = pgTable(
  'featured_cakes',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    images: jsonb('images').notNull().$type<string[]>(),
    capacity: integer('capacity').notNull(),
    flavorList: jsonb('flavor_list').notNull().$type<string[]>(),
    pipingPaletteList: jsonb('piping_palette_list').notNull().$type<string[]>(),
    tagId: uuid('tag_id'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('featured_cakes_name_idx').on(table.name),
    isActiveIdx: index('featured_cakes_is_active_idx').on(table.isActive),
  }),
);

export const featuredCakesRelations = relations(featuredCakes, ({ many, one }) => ({
  tag: one(tags, {
    fields: [featuredCakes.tagId],
    references: [tags.id],
  }),
  CartItems: many(cartItems),
}));
