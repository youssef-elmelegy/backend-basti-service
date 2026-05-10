import {
  pgTable,
  uuid,
  timestamp,
  boolean,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { TranslationObject, DEFAULT_TRANSLATION_OBJECT } from '@/types/translation.types';
import { regionItemPrices } from './region-item-price';

export const offers = pgTable(
  'offers',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: jsonb('name').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
    percentage: integer('percentage').notNull(),
    startDate: timestamp('start_date', { mode: 'date' }),
    expiryDate: timestamp('expiry_date', { mode: 'date' }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('offers_name_idx').on(table.name),
    isActiveIdx: index('offers_is_active_idx').on(table.isActive),
  }),
);

export const offersRelations = relations(offers, ({ many }) => ({
  regionItemPrices: many(regionItemPrices),
}));