import { pgTable, timestamp, uuid, text, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users, admins } from '.';

export const reports = pgTable(
  'reports',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    driverId: uuid('driver_id')
      .notNull()
      .references(() => admins.id, { onDelete: 'cascade' }),
    reportBody: text('report_body').notNull(),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('reports_user_id_idx').on(table.userId),
    driverIdIdx: index('reports_driver_id_idx').on(table.driverId),
  }),
);

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  driver: one(admins, {
    fields: [reports.driverId],
    references: [admins.id],
  }),
}));
