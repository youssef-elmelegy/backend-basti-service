import {
  pgTable,
  varchar,
  text,
  boolean,
  timestamp,
  uuid,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { cartItems, tags } from '.';
import { TranslationObject, DEFAULT_TRANSLATION_OBJECT } from '@/types/translation.types';

export const sweets = pgTable(
  'sweets',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: jsonb('name').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
    description: jsonb('description').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
    tagId: uuid('tag_id'),
    images: jsonb('images').notNull().$type<string[]>(),
    sizes: jsonb('sizes').notNull().$type<string[]>(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('sweets_name_idx').on(table.name),
    isActiveIdx: index('sweets_is_active_idx').on(table.isActive),
  }),
);

export const sweetsRelations = relations(sweets, ({ many, one }) => ({
  tag: one(tags, {
    fields: [sweets.tagId],
    references: [tags.id],
  }),
  CartItems: many(cartItems),
}));
