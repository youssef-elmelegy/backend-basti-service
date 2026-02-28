import { pgTable, uuid, integer, jsonb, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const appConfig = pgTable('app_config', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  openingHour: integer('opening_hour').notNull().default(10),
  closingHour: integer('closing_hour').notNull().default(18),
  minHoursToPrepare: integer('min_hours_to_prepare').notNull().default(24),
  weekendDays: jsonb('weekend_days') // 0->sunday
    .$type<number[]>()
    .notNull()
    .default(sql`'[5, 6]'::jsonb`),
  holidays: jsonb('holidays')
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  emergencyClosures: jsonb('emergency_closures')
    .$type<{ from: string; to: string; reason: string }[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  isOpen: boolean('is_open').notNull().default(true),
  closureMessage: varchar('closure_message', { length: 500 }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});
