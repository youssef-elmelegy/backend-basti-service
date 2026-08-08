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

/**
 * The bakery type vocabulary. `bakery_types` is jsonb rather than a pg enum, so
 * this list is enforced by the `bakeries_bakery_types_vocabulary` CHECK
 * constraint (migration 0009) and by the create/update DTOs — keep all three in
 * step when changing it. `large_cakes` was a legacy alias for `big_cakes` and
 * was rewritten by that same migration.
 */
export const BAKERY_TYPES = ['big_cakes', 'small_cakes', 'others'] as const;

export type BakeryTypeValue = (typeof BAKERY_TYPES)[number];

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

    bakeryTypes: jsonb('bakery_types').notNull().$type<BakeryTypeValue[]>(),

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
