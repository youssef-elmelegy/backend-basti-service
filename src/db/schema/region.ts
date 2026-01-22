import { pgTable, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { bakeries } from '.';

export const regions = pgTable('regions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 255 }).unique().notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const regionsRelations = relations(regions, ({ many }) => ({
  bakeries: many(bakeries),
}));
