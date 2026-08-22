ALTER TABLE "users" ADD COLUMN "first_name_obj" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name_obj" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "name_obj" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "chefs" ADD COLUMN "full_name_obj" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL;