import { pgTable, varchar, timestamp, uuid, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { bakeries, regionItemPrices } from '.';
import { TranslationObject, DEFAULT_TRANSLATION_OBJECT } from '@/types/translation.types';

export const regions = pgTable('regions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: jsonb('name').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
  image: varchar('image'),
  isAvailable: boolean('is_available').default(true).notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const regionsRelations = relations(regions, ({ many }) => ({
  bakeries: many(bakeries),
  itemPrices: many(regionItemPrices),
}));
