ALTER TABLE "users" ALTER COLUMN "first_name" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "first_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "name" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "name" SET DEFAULT '{"en":"","ar":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chefs" ALTER COLUMN "full_name" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "chefs" ALTER COLUMN "full_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;