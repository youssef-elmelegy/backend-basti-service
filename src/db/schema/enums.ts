import { pgEnum } from 'drizzle-orm/pg-core';

export const genderEnum = pgEnum('gender_enum', ['male', 'female']);

export const adminRoleEnum = pgEnum('admin_role_enum', ['super_admin', 'admin', 'manager']);

export const bakeryTypeEnum = pgEnum('bakery_type_enum', [
  'basket_cakes',
  'medium_cakes',
  'small_cakes',
  'large_cakes',
  'custom',
]);

// TODO: we need to review this status
export const orderStatusEnum = pgEnum('order_status_enum', [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
]);

export const paymentMethodTypeEnum = pgEnum('payment_method_type_enum', [
  'credit_card',
  'debit_card',
  'cash',
  'wallet',
]);

export const addonCategoryEnum = pgEnum('addon_category_enum', [
  'balloons',
  'cards',
  'candles',
  'decorations',
  'other',
]);

export const addonInfoTypeEnum = pgEnum('addon_info_type_enum', [
  'color',
  'number',
  'letter',
  'text',
]);
