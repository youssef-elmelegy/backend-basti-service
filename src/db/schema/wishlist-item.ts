import { pgTable, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users, cakes, addons } from '.';

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cakeId: uuid('cake_id').references(() => cakes.id, { onDelete: 'cascade' }),
    addonId: uuid('addon_id').references(() => addons.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('wishlist_items_user_id_idx').on(table.userId),
    uniqueUserCake: index('wishlist_unique_user_cake_idx').on(table.userId, table.cakeId),
    uniqueUserAddon: index('wishlist_unique_user_addon_idx').on(table.userId, table.addonId),
  }),
);

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  cake: one(cakes, {
    fields: [wishlistItems.cakeId],
    references: [cakes.id],
  }),
  addon: one(addons, {
    fields: [wishlistItems.addonId],
    references: [addons.id],
  }),
}));
