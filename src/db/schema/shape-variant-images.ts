import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { shapes } from './shape';
import { flavors } from './flavor';
import { decorations } from './decoration';

export const shapeVariantImages = pgTable(
  'shape_variant_images',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    shapeId: uuid('shape_id')
      .notNull()
      .references(() => shapes.id, { onDelete: 'cascade' }),
    flavorId: uuid('flavor_id').references(() => flavors.id, { onDelete: 'cascade' }),
    decorationId: uuid('decoration_id').references(() => decorations.id, { onDelete: 'cascade' }),
    slicedViewUrl: text('sliced_view_url').notNull(),
    frontViewUrl: text('front_view_url').notNull(),
    topViewUrl: text('top_view_url').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    shapeIdIdx: index('shape_variant_images_shape_id_idx').on(table.shapeId),
    flavorIdIdx: index('shape_variant_images_flavor_id_idx').on(table.flavorId),
    decorationIdIdx: index('shape_variant_images_decoration_id_idx').on(table.decorationId),
  }),
);

export const shapeVariantImagesRelations = relations(shapeVariantImages, ({ one }) => ({
  shape: one(shapes, {
    fields: [shapeVariantImages.shapeId],
    references: [shapes.id],
  }),
  flavor: one(flavors, {
    fields: [shapeVariantImages.flavorId],
    references: [flavors.id],
  }),
  decoration: one(decorations, {
    fields: [shapeVariantImages.decorationId],
    references: [decorations.id],
  }),
}));
