import { pgTable, varchar, timestamp, uuid, text, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { bakeries } from '.';

export const chefs = pgTable(
  'chefs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    bakeryId: uuid('bakery_id')
      .notNull()
      .references(() => bakeries.id, { onDelete: 'cascade' }),

    fullName: varchar('full_name', { length: 255 }).notNull(),
    image: text('image'),
    specialization: varchar('specialization', { length: 255 }).notNull(),
    bio: text('bio'),

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
