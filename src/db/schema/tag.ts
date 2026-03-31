import { pgTable, uuid, varchar, integer, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const tags = pgTable(
  'tags',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 100 }).notNull().unique(),
    displayOrder: integer('display_order').notNull(),
    types: jsonb('types')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('tags_name_idx').on(table.name),
    displayOrderIdx: index('tags_display_order_idx').on(table.displayOrder),
  }),
);
