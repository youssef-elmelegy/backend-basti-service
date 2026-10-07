ALTER TABLE "users" DROP COLUMN IF EXISTS "first_name_obj";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "last_name_obj";--> statement-breakpoint
ALTER TABLE "admins" DROP COLUMN IF EXISTS "name_obj";--> statement-breakpoint
ALTER TABLE "chefs" DROP COLUMN IF EXISTS "name_obj";