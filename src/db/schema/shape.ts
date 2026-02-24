import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { designedCakeConfigs, shapeVariantImages } from '.';

export const shapes = pgTable(
  'shapes',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    shapeUrl: text('shape_url').notNull(),
    size: varchar('size', { length: 50 }).notNull().default('medium'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    titleIdx: index('shapes_title_idx').on(table.title),
  }),
);

export const shapesRelations = relations(shapes, ({ many }) => ({
  designedCakeConfigs: many(designedCakeConfigs),
  shapeVariantImages: many(shapeVariantImages),
}));
