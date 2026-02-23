import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { designedCakeConfigs, shapeVariantImages } from '.';

export const flavors = pgTable(
  'flavors',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    flavorUrl: text('flavor_url').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    titleIdx: index('flavors_title_idx').on(table.title),
  }),
);

export const flavorsRelations = relations(flavors, ({ many }) => ({
  designedCakeConfigs: many(designedCakeConfigs),
  shapeVariantImages: many(shapeVariantImages),
}));
