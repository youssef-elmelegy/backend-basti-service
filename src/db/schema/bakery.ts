import {
  pgTable,
  timestamp,
  uuid,
  integer,
  decimal,
  jsonb,
  index,
  boolean,
  text,
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

/**
 * Maximum number of gallery images a bakery can hold. Enforced by the
 * `bakeries_gallery_images_shape` CHECK constraint (migration 0010) and by the
 * create/update DTOs — keep both in step when changing it.
 */
export const BAKERY_GALLERY_MAX_IMAGES = 3;

/** Maximum length of the management-only notes field. */
export const BAKERY_NOTES_MAX_LENGTH = 2000;

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

    // Management-only free-text notes. Plain text rather than a TranslationObject
    // like `name`/`location_description`: these are internal memos written and
    // read by admins, so they must come back in the exact wording they were
    // saved in rather than being rewritten by the translation service.
    notes: text('notes'),

    // Optional branding. `logo_url` is a single image; `gallery_images` holds up
    // to BAKERY_GALLERY_MAX_IMAGES urls and defaults to an empty array so reads
    // never have to null-check it.
    logoUrl: text('logo_url'),
    galleryImages: jsonb('gallery_images')
      .$type<string[]>()
      .default(sql`'[]'::jsonb`)
      .notNull(),

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
