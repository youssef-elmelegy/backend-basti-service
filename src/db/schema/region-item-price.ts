import { pgTable, uuid, decimal, jsonb, index, timestamp, check } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { regions, addons, featuredCakes, sweets } from '.';

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
    onlyOneProductCheck: check(
      'only_one_product',
      sql`(CASE WHEN addon_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN featured_cake_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN sweet_id IS NOT NULL THEN 1 ELSE 0 END) = 1`,
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
}));
