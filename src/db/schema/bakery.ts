import {
  pgTable,
  timestamp,
  uuid,
  integer,
  decimal,
  jsonb,
  index,
  boolean,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { regions, chefs, orders, reviews, admins, bakeryItemStores } from '.';
import { TranslationObject, DEFAULT_TRANSLATION_OBJECT } from '@/types/translation.types';

export const bakeries = pgTable(
  'bakeries',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    regionId: uuid('region_id')
      .notNull()
      .references(() => regions.id),
    managerId: uuid('manager_id').references(() => admins.id),

    name: jsonb('name').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
    locationDescription: jsonb('location_description')
      .$type<TranslationObject>()
      .default(DEFAULT_TRANSLATION_OBJECT)
      .notNull(),
    capacity: integer('capacity').notNull(),

    bakeryTypes: jsonb('bakery_types')
      .notNull()
      .$type<Array<'big_cakes' | 'small_cakes' | 'others'>>(),

    averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default('0'),
    totalReviews: integer('total_reviews').default(0).notNull(),

    // Soft-delete flag. Deleted bakeries are hidden from all listings/lookups but
    // remain referenced by their historical (completed/cancelled) orders.
    isDeleted: boolean('is_deleted').default(false).notNull(),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    regionIdIdx: index('bakeries_region_id_idx').on(table.regionId),
    nameIdx: index('bakeries_name_idx').on(table.name),
    managerIdIdx: index('bakeries_manager_id_idx').on(table.managerId),
  }),
);

export const bakeriesRelations = relations(bakeries, ({ one, many }) => ({
  region: one(regions, {
    fields: [bakeries.regionId],
    references: [regions.id],
  }),
  manager: one(admins, {
    fields: [bakeries.managerId],
    references: [admins.id],
  }),
  chefs: many(chefs),
  orders: many(orders),
  reviews: many(reviews),
  itemStores: many(bakeryItemStores),
}));
