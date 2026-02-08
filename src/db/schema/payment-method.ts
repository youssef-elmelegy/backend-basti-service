import { pgTable, varchar, boolean, timestamp, uuid, integer, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { paymentMethodTypeEnum, users, orders } from '.';

export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: paymentMethodTypeEnum('type').notNull(),

    cardHolderName: varchar('card_holder_name', { length: 255 }),
    cardLastFourDigits: varchar('card_last_four_digits', { length: 4 }),
    cardExpiryMonth: integer('card_expiry_month'),
    cardExpiryYear: integer('card_expiry_year'),

    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('payment_methods_user_id_idx').on(table.userId),
  }),
);

export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
  user: one(users, {
    fields: [paymentMethods.userId],
    references: [users.id],
  }),
  orders: many(orders),
}));
