import { pgTable, uuid, varchar, text, decimal, timestamp, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const shapes = pgTable(
  'shapes',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: varchar('title', { length: 255 }).notNull(),
    shapeUrl: text('shape_url').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    titleIdx: index('shapes_title_idx').on(table.title),
  }),
);

export const shapesRelations = relations(shapes, ({ many }) => ({
  designedCakeConfigs: many(designedCakeConfigs),
}));

import { designedCakeConfigs } from './designed-cake-config';
