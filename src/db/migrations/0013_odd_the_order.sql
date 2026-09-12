ALTER TABLE "users" ALTER COLUMN "first_name" SET DATA TYPE jsonb USING jsonb_build_object('en', COALESCE("first_name", ''), 'ar', COALESCE("first_name", ''));--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "first_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET DATA TYPE jsonb USING jsonb_build_object('en', COALESCE("last_name", ''), 'ar', COALESCE("last_name", ''));--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "name" SET DATA TYPE jsonb USING jsonb_build_object('en', COALESCE("name", ''), 'ar', COALESCE("name", ''));--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "name" SET DEFAULT '{"en":"","ar":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chefs" ALTER COLUMN "full_name" SET DATA TYPE jsonb USING jsonb_build_object('en', COALESCE("full_name", ''), 'ar', COALESCE("full_name", ''));--> statement-breakpoint
ALTER TABLE "chefs" ALTER COLUMN "full_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;