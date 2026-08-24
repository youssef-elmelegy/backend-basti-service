import { pgTable, timestamp, uuid, text, index, jsonb } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { bakeries } from '.';
import { TranslationObject, DEFAULT_TRANSLATION_OBJECT } from '@/types/translation.types';

export const chefs = pgTable(
  'chefs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),

    fullName: jsonb('full_name')
      .$type<TranslationObject>()
      .default(DEFAULT_TRANSLATION_OBJECT)
      .notNull(),
    fullNameObj: jsonb('full_name_obj')
      .$type<TranslationObject>()
      .default(DEFAULT_TRANSLATION_OBJECT)
      .notNull(),
    image: text('image'),
    specialization: jsonb('specialization')
      .$type<TranslationObject>()
      .default(DEFAULT_TRANSLATION_OBJECT)
      .notNull(),
    bio: jsonb('bio').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    bakeryIdIdx: index('chefs_bakery_id_idx').on(table.bakeryId),
  }),
);

export const chefsRelations = relations(chefs, ({ one }) => ({
  bakery: one(bakeries, {
    fields: [chefs.bakeryId],
    references: [bakeries.id],
  }),
}));
