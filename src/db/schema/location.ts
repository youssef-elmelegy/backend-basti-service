import { pgTable, varchar, timestamp, uuid, decimal, text, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users, orders } from '.';

export const locations = pgTable(
  'locations',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    label: varchar('label', { length: 50 }).notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
    longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
    buildingNo: varchar('building_no', { length: 50 }),
    street: varchar('street', { length: 255 }).notNull(),
    area: varchar('area', { length: 255 }).notNull(),
    apartmentNo: varchar('apartment_no', { length: 50 }),
    officeNo: varchar('office_no', { length: 50 }),
    floor: varchar('floor', { length: 50 }),
    additionalInfo: text('additional_info'),
    type: varchar('type', { length: 20 }).$type<'house' | 'apartment' | 'office'>().notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('locations_user_id_idx').on(table.userId),
  }),
);

export const locationsRelations = relations(locations, ({ one, many }) => ({
  user: one(users, {
    fields: [locations.userId],
    references: [users.id],
  }),
  orders: many(orders),
}));
