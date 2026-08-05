import { pgTable, timestamp, uuid, text, integer, jsonb, boolean } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { tags } from './tag';
import { TranslationObject, DEFAULT_TRANSLATION_OBJECT } from '@/types/translation.types';

export const sliderImages = pgTable('slider_images', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: jsonb('title').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
  imageUrl: text('image_url').notNull(),
  displayOrder: integer('display_order').notNull().unique(),
  // Real FK: when a tag is deleted the reference is cleared rather than left dangling.
  // The accompanying `isHidden` flag is set by the tag-deletion flow, since a slider
  // without a tag has nothing to link to and must not be shown to customers.
  tagId: uuid('tag_id').references(() => tags.id, { onDelete: 'set null' }),
  isHidden: boolean('is_hidden').default(false).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const sliderImagesRelations = relations(sliderImages, ({ one }) => ({
  tag: one(tags, {
    fields: [sliderImages.tagId],
    references: [tags.id],
  }),
}));
