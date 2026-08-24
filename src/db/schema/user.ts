import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  uuid,
  text,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import {
  languageEnum,
  locations,
  orders,
  cartItems,
  paymentMethods,
  reviews,
  notifications,
  couponUsages,
  reports,
} from '.';
import { DEFAULT_TRANSLATION_OBJECT, TranslationObject } from '@/types/translation.types';

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    firstName: jsonb('first_name')
      .$type<TranslationObject>()
      .default(DEFAULT_TRANSLATION_OBJECT)
      .notNull(),
    lastName: jsonb('last_name')
      .$type<TranslationObject>()
      .default(DEFAULT_TRANSLATION_OBJECT)
      .notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    isEmailVerified: boolean('is_email_verified').default(false).notNull(),
    phoneNumber: varchar('phone_number', { length: 20 }),
    password: varchar('password', { length: 255 }).notNull(),
    otpCode: varchar('otp_code', { length: 10 }),
    otpExpiresAt: timestamp('otp_expires_at', { mode: 'date' }),
    profileImage: text('profile_image'),
    fcmToken: text('fcm_token'),
    // Language the FCM push is delivered in — see languageEnum.
    language: languageEnum('language').default('ar').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    phoneNumberIdx: index('users_phone_number_idx').on(table.phoneNumber),
    emailIdx: index('users_email_idx').on(table.email),
  }),
);

export const userRelations = relations(users, ({ one, many }) => ({
  locations: many(locations),
  orders: many(orders),
  CartItems: many(cartItems),
  paymentMethods: many(paymentMethods),
  reviews: many(reviews),
  notifications: many(notifications),
  reports: many(reports),
  couponUsages: one(couponUsages, {
    fields: [users.id],
    references: [couponUsages.userId],
  }),
}));
