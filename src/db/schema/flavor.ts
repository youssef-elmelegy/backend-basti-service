import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  boolean,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { designedCakeConfigs, shapeVariantImages } from '.';
import { TranslationObject, DEFAULT_TRANSLATION_OBJECT } from '@/types/translation.types';

export const flavors = pgTable(
  'flavors',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: jsonb('title').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
    description: jsonb('description').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
    flavorUrl: text('flavor_url').notNull(),
    order: integer('order').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    titleIdx: index('flavors_title_idx').on(table.title),
    isActiveIdx: index('flavors_is_active_idx').on(table.isActive),
  }),
);

export const flavorsRelations = relations(flavors, ({ many }) => ({
  designedCakeConfigs: many(designedCakeConfigs),
  shapeVariantImages: many(shapeVariantImages),
}));
