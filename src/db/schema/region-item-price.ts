import { pgTable, uuid, decimal, jsonb, index, timestamp, check } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import {
  regions,
  addons,
  featuredCakes,
  sweets,
  decorations,
  flavors,
  shapes,
  predesignedCakes,
} from '.';

export const regionItemPrices = pgTable(
  'region_item_prices',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    regionId: uuid('region_id')
      .notNull()
      .references(() => regions.id, { onDelete: 'cascade' }),
    addonId: uuid('addon_id').references(() => addons.id, { onDelete: 'cascade' }),
    featuredCakeId: uuid('featured_cake_id').references(() => featuredCakes.id, {
      onDelete: 'cascade',
    }),
    sweetId: uuid('sweet_id').references(() => sweets.id, { onDelete: 'cascade' }),
    decorationId: uuid('decoration_id').references(() => decorations.id, { onDelete: 'cascade' }),
    flavorId: uuid('flavor_id').references(() => flavors.id, { onDelete: 'cascade' }),
    shapeId: uuid('shape_id').references(() => shapes.id, { onDelete: 'cascade' }),
    predesignedCakeId: uuid('predesigned_cake_id').references(() => predesignedCakes.id, {
      onDelete: 'cascade',
    }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    sizesPrices: jsonb('sizes_prices').$type<Record<string, string>>(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    regionIdIdx: index('region_item_prices_region_id_idx').on(table.regionId),
    addonIdIdx: index('region_item_prices_addon_id_idx').on(table.addonId),
    featuredCakeIdIdx: index('region_item_prices_featured_cake_id_idx').on(table.featuredCakeId),
    sweetIdIdx: index('region_item_prices_sweet_id_idx').on(table.sweetId),
    decorationIdIdx: index('region_item_prices_decoration_id_idx').on(table.decorationId),
    flavorIdIdx: index('region_item_prices_flavor_id_idx').on(table.flavorId),
    shapeIdIdx: index('region_item_prices_shape_id_idx').on(table.shapeId),
    predesignedCakeIdIdx: index('region_item_prices_predesigned_cake_id_idx').on(
      table.predesignedCakeId,
    ),
    onlyOneProductCheck: check(
      'only_one_product',
      sql`(CASE WHEN addon_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN featured_cake_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN sweet_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN decoration_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN flavor_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN shape_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN predesigned_cake_id IS NOT NULL THEN 1 ELSE 0 END) = 1`,
    ),
  }),
);

export const regionItemPricesRelations = relations(regionItemPrices, ({ one }) => ({
  region: one(regions, {
    fields: [regionItemPrices.regionId],
    references: [regions.id],
  }),
  addon: one(addons, {
    fields: [regionItemPrices.addonId],
    references: [addons.id],
  }),
  featuredCake: one(featuredCakes, {
    fields: [regionItemPrices.featuredCakeId],
    references: [featuredCakes.id],
  }),
  sweet: one(sweets, {
    fields: [regionItemPrices.sweetId],
    references: [sweets.id],
  }),
  decoration: one(decorations, {
    fields: [regionItemPrices.decorationId],
    references: [decorations.id],
  }),
  flavor: one(flavors, {
    fields: [regionItemPrices.flavorId],
    references: [flavors.id],
  }),
  shape: one(shapes, {
    fields: [regionItemPrices.shapeId],
    references: [shapes.id],
  }),
  predesignedCake: one(predesignedCakes, {
    fields: [regionItemPrices.predesignedCakeId],
    references: [predesignedCakes.id],
  }),
}));
