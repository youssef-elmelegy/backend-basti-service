import { pgTable, timestamp, uuid, text, integer } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const sliderImages = pgTable('slider_images', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  imageUrl: text('image_url').notNull(),
  displayOrder: integer('display_order').notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const sliderImagesRelations = relations(sliderImages, () => ({}));
