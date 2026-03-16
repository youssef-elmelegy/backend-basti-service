import { pgTable, uuid, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { bakeries, regionItemPrices } from '.';

export const bakeryItemStores = pgTable(
  'bakery_item_stores',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),
    regionItemPriceId: uuid('region_item_price_id')
      .notNull()
      .references(() => regionItemPrices.id, { onDelete: 'cascade' }),
    stock: integer('stock').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    bakeryIdIdx: index('bakery_item_stores_bakery_id_idx').on(table.bakeryId),
    regionItemPriceIdIdx: index('bakery_item_stores_region_item_price_id_idx').on(
      table.regionItemPriceId,
    ),
  }),
);

export const bakeryItemStoresRelations = relations(bakeryItemStores, ({ one }) => ({
  bakery: one(bakeries, {
    fields: [bakeryItemStores.bakeryId],
    references: [bakeries.id],
  }),
  regionItemPrice: one(regionItemPrices, {
    fields: [bakeryItemStores.regionItemPriceId],
    references: [regionItemPrices.id],
  }),
}));
