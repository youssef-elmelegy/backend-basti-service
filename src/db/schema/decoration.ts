import { pgTable, uuid, varchar, text, timestamp, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { designedCakeConfigs, tags } from '.';

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
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    titleIdx: index('decorations_title_idx').on(table.title),
  }),
);

export const decorationsRelations = relations(decorations, ({ many, one }) => ({
  tag: one(tags, {
    fields: [decorations.tagId],
    references: [tags.id],
  }),
  designedCakeConfigs: many(designedCakeConfigs),
}));
