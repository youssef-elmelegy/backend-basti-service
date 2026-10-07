-- Convert the plain-text name columns to jsonb TranslationObjects.
--
-- As generated, this migration read:
--     ALTER TABLE "users" ALTER COLUMN "first_name" SET DATA TYPE jsonb;
-- which cannot run. Postgres has no implicit cast from varchar to jsonb, so the
-- statement aborts with:
--     column "first_name" cannot be cast automatically to type jsonb
--     HINT: You might need to specify "USING first_name::jsonb".
--
-- A bare `USING first_name::jsonb` would not work either: the stored values are
-- bare names like 'Youssef', which are not valid JSON documents and would fail
-- with "invalid input syntax for type json". The existing name has to be
-- *wrapped* into the {en, ar} shape rather than parsed as JSON, which is what
-- jsonb_build_object below does. The same value seeds both languages; the
-- translation service refines them later.
--
-- Each conversion is guarded on the column's current type so the migration is
-- idempotent: on a database where it already ran (or where the column was
-- converted by hand) the block is skipped instead of erroring.

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'first_name') <> 'jsonb' THEN
    ALTER TABLE "users" ALTER COLUMN "first_name" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "first_name" SET DATA TYPE jsonb
      USING jsonb_build_object('en', COALESCE("first_name", ''), 'ar', COALESCE("first_name", ''));
    ALTER TABLE "users" ALTER COLUMN "first_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;
  END IF;

  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'last_name') <> 'jsonb' THEN
    ALTER TABLE "users" ALTER COLUMN "last_name" DROP DEFAULT;
    ALTER TABLE "users" ALTER COLUMN "last_name" SET DATA TYPE jsonb
      USING jsonb_build_object('en', COALESCE("last_name", ''), 'ar', COALESCE("last_name", ''));
    ALTER TABLE "users" ALTER COLUMN "last_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;
  END IF;

  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'admins' AND column_name = 'name') <> 'jsonb' THEN
    ALTER TABLE "admins" ALTER COLUMN "name" DROP DEFAULT;
    ALTER TABLE "admins" ALTER COLUMN "name" SET DATA TYPE jsonb
      USING jsonb_build_object('en', COALESCE("name", ''), 'ar', COALESCE("name", ''));
    ALTER TABLE "admins" ALTER COLUMN "name" SET DEFAULT '{"en":"","ar":""}'::jsonb;
    -- The generated migration also tightened this column to NOT NULL. The
    -- USING expression above already COALESCEd every row to a non-null object,
    -- so the constraint can be added safely.
    ALTER TABLE "admins" ALTER COLUMN "name" SET NOT NULL;
  END IF;

  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'chefs' AND column_name = 'full_name') <> 'jsonb' THEN
    ALTER TABLE "chefs" ALTER COLUMN "full_name" DROP DEFAULT;
    ALTER TABLE "chefs" ALTER COLUMN "full_name" SET DATA TYPE jsonb
      USING jsonb_build_object('en', COALESCE("full_name", ''), 'ar', COALESCE("full_name", ''));
    ALTER TABLE "chefs" ALTER COLUMN "full_name" SET DEFAULT '{"en":"","ar":""}'::jsonb;
  END IF;
END $$;
