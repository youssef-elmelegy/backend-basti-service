import { pgTable, varchar, boolean, timestamp, uuid, text, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { adminRoleEnum, bakeries } from '.';

export const admins = pgTable(
  'admins',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: varchar('email', { length: 255 }).unique().notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    role: adminRoleEnum('role').default('admin').notNull(),
    profileImage: text('profile_image'),
    bakeryId: uuid('bakery_id'),

    otpCode: varchar('otp_code', { length: 10 }),
    otpExpiresAt: timestamp('otp_expires_at', { mode: 'date' }),

    isBlocked: boolean('is_blocked').default(false).notNull(),
    blockedAt: timestamp('blocked_at', { mode: 'date' }),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('admins_email_idx').on(table.email),
    isBlockedIdx: index('admins_is_blocked_idx').on(table.isBlocked),
    bakeryIdIdx: index('admins_bakery_id_idx').on(table.bakeryId),
  }),
);

export const adminsRelations = relations(admins, ({ one }) => ({
  bakery: one(bakeries, {
    fields: [admins.bakeryId],
    references: [bakeries.id],
  }),
}));
