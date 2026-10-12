ALTER TABLE "orders" ALTER COLUMN "basti_percentage" SET DATA TYPE numeric(10, 4);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "basti_percentage" SET DEFAULT '0.0000';--> statement-breakpoint
ALTER TABLE "bakeries" ADD COLUMN "basti_percentage" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "bakeries" ADD COLUMN "mini_cake_percentage" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
-- Preserve each existing bakery's current global rates before the singleton
-- config columns disappear. New bakery records receive explicit rates through
-- the bakery API.
UPDATE "bakeries"
SET
  "basti_percentage" = COALESCE((SELECT "basti_percentage" FROM "app_config" LIMIT 1), 0),
  "mini_cake_percentage" = COALESCE((SELECT "mini_cake_percentage" FROM "app_config" LIMIT 1), 0);--> statement-breakpoint
ALTER TABLE "app_config" DROP COLUMN "basti_percentage";--> statement-breakpoint
ALTER TABLE "app_config" DROP COLUMN "mini_cake_percentage";
