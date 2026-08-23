import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  uuid,
  text,
  index,
  decimal,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { adminRoleEnum, bakeries, languageEnum, notifications, orders, regions, reports } from '.';
import { DEFAULT_TRANSLATION_OBJECT, TranslationObject } from '@/types/translation.types';

export const admins = pgTable(
  'admins',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: jsonb('name').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
    nameObj: jsonb('name_obj')
      .$type<TranslationObject>()
      .default(DEFAULT_TRANSLATION_OBJECT)
      .notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: adminRoleEnum('role').default('admin').notNull(),
    profileImage: text('profile_image'),
    phoneNumber: varchar('phone_number', { length: 20 }),
    bakeryId: uuid('bakery_id'),
    regionId: uuid('region_id').references(() => regions.id),
    fcmToken: text('fcm_token'),
    // Language the FCM push is delivered in — see languageEnum.
    language: languageEnum('language').default('ar').notNull(),

    otpCode: varchar('otp_code', { length: 10 }),
    otpExpiresAt: timestamp('otp_expires_at', { mode: 'date' }),

    isBlocked: boolean('is_blocked').default(false).notNull(),
    blockedAt: timestamp('blocked_at', { mode: 'date' }),

    // [FOR DRIVERS]: their earnings are calculated based on the orders they deliver, and stored here for quick retrieval
    dueAmount: decimal('due_amount', { precision: 10, scale: 2 }).default('0').notNull(),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('admins_email_idx').on(table.email),
    isBlockedIdx: index('admins_is_blocked_idx').on(table.isBlocked),
    bakeryIdIdx: index('admins_bakery_id_idx').on(table.bakeryId),
    regionIdIdx: index('admins_region_id_idx').on(table.regionId),
  }),
);

export const adminsRelations = relations(admins, ({ one, many }) => ({
  bakery: one(bakeries, {
    fields: [admins.bakeryId],
    references: [bakeries.id],
  }),
  region: one(regions, {
    fields: [admins.regionId],
    references: [regions.id],
  }),
  orders: many(orders),
  notifications: many(notifications),
  driverReports: many(reports),
}));
