import { pgTable, uuid, varchar, text, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { tags } from './tag';
import { cartItems } from './cart-item';

export const predesignedCakes = pgTable(
  'predesigned_cakes',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    tagId: uuid('tag_id'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('predesigned_cakes_name_idx').on(table.name),
    isActiveIdx: index('predesigned_cakes_is_active_idx').on(table.isActive),
  }),
);

export const predesignedCakesRelations = relations(predesignedCakes, ({ one, many }) => ({
  tag: one(tags, {
    fields: [predesignedCakes.tagId],
    references: [tags.id],
  }),
  configs: many(designedCakeConfigs),
  CartItems: many(cartItems),
}));

import { designedCakeConfigs } from './designed-cake-config';
