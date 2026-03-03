import {
  pgTable,
  varchar,
  timestamp,
  uuid,
  integer,
  decimal,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { addons, orders, sweets, predesignedCakes, featuredCakes } from '.';

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    addonId: uuid('addon_id').references(() => addons.id),
    sweetId: uuid('sweet_id').references(() => sweets.id),
    predesignedCakeId: uuid('predesigned_cakes_id').references(() => predesignedCakes.id),
    featuredCakeId: uuid('featured_cake_id').references(() => featuredCakes.id),

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

    quantity: integer('quantity').notNull().default(1),
    size: varchar('size', { length: 50 }),
    flavor: varchar('flavor', { length: 100 }),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),

    selectedOptions: jsonb('selected_options').$type<
      Array<{
        optionId: string;
        type: string;
        label: string;
        value: string;
      }>
    >(),

    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
  }),
);

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  addon: one(addons, {
    fields: [orderItems.addonId],
    references: [addons.id],
  }),
  sweet: one(sweets, {
    fields: [orderItems.sweetId],
    references: [sweets.id],
  }),
  featuredCake: one(featuredCakes, {
    fields: [orderItems.featuredCakeId],
    references: [featuredCakes.id],
  }),
  predesignedCake: one(predesignedCakes, {
    fields: [orderItems.predesignedCakeId],
    references: [predesignedCakes.id],
  }),
}));
