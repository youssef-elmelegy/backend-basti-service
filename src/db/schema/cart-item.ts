import { pgTable, timestamp, uuid, index, jsonb, boolean, integer } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { users, featuredCakes, addons, sweets, predesignedCakes, CartTypeEnum } from '.';

export const cartItems = pgTable(
  'cart_items',
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
    predesignedCakeId: uuid('predesigned_cake_id').references(() => predesignedCakes.id, {
      onDelete: 'cascade',
    }),
    customCake: jsonb('custom_cake').$type<{
      shapeId: string;
      flavorId: string;
      decorationId: string;
      color: {
        name: string;
        hex: string;
      };
      extraLayers?: {
        layer: number;
        flavorId: string;
      }[];
      message?: string;
      imageToPrint?: string;
      snapshotFront?: string;
      snapshotTop?: string;
      snapshotSliced?: string;
    }>(),
    type: CartTypeEnum('type').default('big_cakes').notNull(),
    isIncluded: boolean('is_included').default(true).notNull(),
    quantity: integer('quantity').default(1).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('cart_items_user_id_idx').on(table.userId),
    uniqueUserFeaturedCake: index('cart_unique_user_featured_cake_idx').on(
      table.userId,
      table.featuredCakeId,
    ),
    uniqueUserAddon: index('cart_unique_user_addon_idx').on(table.userId, table.addonId),
    uniqueUserSweet: index('cart_unique_user_sweet_idx').on(table.userId, table.sweetId),
  }),
);

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  featuredCakes: one(featuredCakes, {
    fields: [cartItems.featuredCakeId],
    references: [featuredCakes.id],
  }),
  predesignedCakes: one(predesignedCakes, {
    fields: [cartItems.predesignedCakeId],
    references: [predesignedCakes.id],
  }),
  addon: one(addons, {
    fields: [cartItems.addonId],
    references: [addons.id],
  }),
  sweet: one(sweets, {
    fields: [cartItems.sweetId],
    references: [sweets.id],
  }),
}));
