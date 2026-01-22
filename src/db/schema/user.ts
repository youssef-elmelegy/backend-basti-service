import { pgTable, varchar, boolean, timestamp, uuid, text, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { locations, orders, wishlistItems, paymentMethods, reviews } from '.';

export const users = pgTable(
  'users',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    isEmailVerified: boolean('is_email_verified').default(false).notNull(),
    phoneNumber: varchar('phone_number', { length: 20 }),
    password: varchar('password', { length: 255 }).notNull(),
    otpCode: varchar('otp_code', { length: 10 }),
    otpExpiresAt: timestamp('otp_expires_at', { mode: 'date' }),
    profileImage: text('profile_image'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    phoneNumberIdx: index('users_phone_number_idx').on(table.phoneNumber),
    emailIdx: index('users_email_idx').on(table.email),
  }),
);

export const userRelations = relations(users, ({ many }) => ({
  locations: many(locations),
  orders: many(orders),
  wishlistItems: many(wishlistItems),
  paymentMethods: many(paymentMethods),
  reviews: many(reviews),
}));
