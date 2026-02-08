import { pgTable, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users, featuredCakes, addons, sweets } from '.';

export const wishlistItems = pgTable(
  'wishlist_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    featuredCakeId: uuid('featured_cake_id').references(() => featuredCakes.id, {
      onDelete: 'cascade',
    }),
    addonId: uuid('addon_id').references(() => addons.id, { onDelete: 'cascade' }),
    sweetId: uuid('sweet_id').references(() => sweets.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('wishlist_items_user_id_idx').on(table.userId),
    uniqueUserFeaturedCake: index('wishlist_unique_user_featured_cake_idx').on(
      table.userId,
      table.featuredCakeId,
    ),
    uniqueUserAddon: index('wishlist_unique_user_addon_idx').on(table.userId, table.addonId),
    uniqueUserSweet: index('wishlist_unique_user_sweet_idx').on(table.userId, table.sweetId),
  }),
);

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  featuredCakes: one(featuredCakes, {
    fields: [wishlistItems.featuredCakeId],
    references: [featuredCakes.id],
  }),
  addon: one(addons, {
    fields: [wishlistItems.addonId],
    references: [addons.id],
  }),
  sweet: one(sweets, {
    fields: [wishlistItems.sweetId],
    references: [sweets.id],
  }),
}));
