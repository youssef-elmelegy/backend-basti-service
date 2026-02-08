import { pgTable, uuid, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';
import { predesignedCakes } from './predesigned-cake';
import { shapes } from './shape';
import { flavors } from './flavor';
import { decorations } from './decoration';

export const designedCakeConfigs = pgTable(
  'designed_cake_configs',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    predesignedCakeId: uuid('predesigned_cake_id')
      .notNull()
      .references(() => predesignedCakes.id, { onDelete: 'cascade' }),
    shapeId: uuid('shape_id')
      .notNull()
      .references(() => shapes.id, { onDelete: 'restrict' }),
    flavorId: uuid('flavor_id')
      .notNull()
      .references(() => flavors.id, { onDelete: 'restrict' }),
    decorationId: uuid('decoration_id')
      .notNull()
      .references(() => decorations.id, { onDelete: 'restrict' }),
    frostColorValue: varchar('frost_color_value', { length: 100 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    predesignedCakeIdIdx: index('designed_cake_configs_predesigned_cake_id_idx').on(
      table.predesignedCakeId,
    ),
    shapeIdIdx: index('designed_cake_configs_shape_id_idx').on(table.shapeId),
    flavorIdIdx: index('designed_cake_configs_flavor_id_idx').on(table.flavorId),
    decorationIdIdx: index('designed_cake_configs_decoration_id_idx').on(table.decorationId),
  }),
);

export const designedCakeConfigsRelations = relations(designedCakeConfigs, ({ one }) => ({
  predesignedCake: one(predesignedCakes, {
    fields: [designedCakeConfigs.predesignedCakeId],
    references: [predesignedCakes.id],
  }),
  shape: one(shapes, {
    fields: [designedCakeConfigs.shapeId],
    references: [shapes.id],
  }),
  flavor: one(flavors, {
    fields: [designedCakeConfigs.flavorId],
    references: [flavors.id],
  }),
  decoration: one(decorations, {
    fields: [designedCakeConfigs.decorationId],
    references: [decorations.id],
  }),
}));
