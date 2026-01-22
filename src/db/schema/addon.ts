import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  uuid,
  decimal,
  text,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { addonCategoryEnum, addonInfoTypeEnum, orderItems, wishlistItems } from '.';

export const addons = pgTable(
  'addons',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    category: addonCategoryEnum('category').notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    images: jsonb('images').notNull().$type<string[]>(),
    tags: jsonb('tags').notNull().$type<string[]>(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('addons_name_idx').on(table.name),
    categoryIdx: index('addons_category_idx').on(table.category),
    isActiveIdx: index('addons_is_active_idx').on(table.isActive),
  }),
);

export const addonsRelations = relations(addons, ({ many }) => ({
  addonOptions: many(addonOptions),
  orderItems: many(orderItems),
  wishlistItems: many(wishlistItems),
}));

// Addon Options (for colors, numbers, letters, etc.)
export const addonOptions = pgTable(
  'addon_options',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    addonId: uuid('addon_id')
      .notNull()
      .references(() => addons.id, { onDelete: 'cascade' }),
    type: addonInfoTypeEnum('type').notNull(), // color, number, letter, text
    label: varchar('label', { length: 100 }).notNull(), // e.g., "Red", "5", "A"
    value: varchar('value', { length: 100 }).notNull(), // The actual value
    imageUrl: text('image_url'), // Optional image for this option
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    addonIdIdx: index('addon_options_addon_id_idx').on(table.addonId),
  }),
);

export const addonOptionsRelations = relations(addonOptions, ({ one }) => ({
  addon: one(addons, {
    fields: [addonOptions.addonId],
    references: [addons.id],
  }),
}));
