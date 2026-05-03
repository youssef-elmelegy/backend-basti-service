import { pgTable, timestamp, uuid, text, integer, jsonb } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { TranslationObject, DEFAULT_TRANSLATION_OBJECT } from '@/types/translation.types';

export const sliderImages = pgTable('slider_images', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: jsonb('title').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
  imageUrl: text('image_url').notNull(),
  displayOrder: integer('display_order').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const sliderImagesRelations = relations(sliderImages, () => ({}));
