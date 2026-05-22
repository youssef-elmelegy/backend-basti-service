import { pgTable, boolean, timestamp, uuid, text, index, jsonb } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { notificationTypeEnum, users, admins } from '.';
import { TranslationObject, DEFAULT_TRANSLATION_OBJECT } from '@/types/translation.types';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),

    title: jsonb('title').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
    body: jsonb('body').$type<TranslationObject>().default(DEFAULT_TRANSLATION_OBJECT).notNull(),
    type: notificationTypeEnum('type').notNull(),

    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    adminId: uuid('admin_id').references(() => admins.id, { onDelete: 'cascade' }),

    redirectId: text('redirect_id'),

    isRead: boolean('is_read').default(false).notNull(),
    readAt: timestamp('read_at', { mode: 'date' }),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_idx').on(table.userId),
    adminIdIdx: index('notifications_admin_id_idx').on(table.adminId),
    typeIdx: index('notifications_type_idx').on(table.type),
    isReadIdx: index('notifications_is_read_idx').on(table.isRead),
    createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  }),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  admin: one(admins, {
    fields: [notifications.adminId],
    references: [admins.id],
  }),
}));
