import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { designedCakeConfigs, tags, shapeVariantImages } from '.';

export const decorations = pgTable(
  'decorations',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),
    tagId: uuid('tag_id'),
    decorationUrl: text('decoration_url').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    minPrepHours: integer('min_prep_hours').default(0).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    titleIdx: index('decorations_title_idx').on(table.title),
    isActiveIdx: index('decorations_is_active_idx').on(table.isActive),
  }),
);

export const decorationsRelations = relations(decorations, ({ many, one }) => ({
  tag: one(tags, {
    fields: [decorations.tagId],
    references: [tags.id],
  }),
  designedCakeConfigs: many(designedCakeConfigs),
  shapeVariantImages: many(shapeVariantImages),
}));
