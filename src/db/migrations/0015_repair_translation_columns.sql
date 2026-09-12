DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'first_name'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE "users"
      ALTER COLUMN "first_name" SET DATA TYPE jsonb
      USING jsonb_build_object('en', COALESCE("first_name", ''), 'ar', COALESCE("first_name", ''));
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'last_name'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE "users"
      ALTER COLUMN "last_name" SET DATA TYPE jsonb
      USING jsonb_build_object('en', COALESCE("last_name", ''), 'ar', COALESCE("last_name", ''));
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'admins'
      AND column_name = 'name'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE "admins"
      ALTER COLUMN "name" SET DATA TYPE jsonb
      USING jsonb_build_object('en', COALESCE("name", ''), 'ar', COALESCE("name", ''));
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'chefs'
      AND column_name = 'full_name'
      AND data_type = 'character varying'
  ) THEN
    ALTER TABLE "chefs"
      ALTER COLUMN "full_name" SET DATA TYPE jsonb
      USING jsonb_build_object('en', COALESCE("full_name", ''), 'ar', COALESCE("full_name", ''));
  END IF;
END $$;--> statement-breakpoint

ALTER TABLE "users" ALTER COLUMN "first_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "last_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "name" SET DEFAULT '{"en":"","ar":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "chefs" ALTER COLUMN "full_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;
