-- Add the `_obj` TranslationObject columns to `users`, `admins` and `chefs`.
--
-- The ADD COLUMNs use IF NOT EXISTS because these columns were first applied by
-- hand on the shared database before this migration was recorded there. That
-- database's migration ledger stops at 0008 while the columns already exist, so
-- a plain ADD COLUMN aborts the entire `drizzle-kit migrate` run with
-- "column ... already exists" and the deploy can never move past it.
-- Re-running must be a no-op there while still doing the real work on a fresh
-- database. Same reasoning and same treatment as migration 0011.
--
-- `chefs` uses "full_name_obj": that is the name the column was actually
-- created with on the shared database.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name_obj" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name_obj" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "name_obj" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "chefs" ADD COLUMN IF NOT EXISTS "full_name_obj" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL;
