-- Add optional management fields to bakeries: notes, logo, and a small gallery.
--
-- All three are optional by design — every existing bakery stays valid without
-- them, so `notes` and `logo_url` are plain nullable text and `gallery_images`
-- backfills to an empty array.
--
-- `notes` is plain text rather than a TranslationObject like `name` /
-- `location_description`: these are internal memos written and read by admins,
-- so they must come back in the exact wording they were saved in rather than
-- being rewritten by the translation service.
--
-- `gallery_images` is jsonb rather than text[] to match how every other image
-- list in this schema is stored (addons, sweets and featured cakes all use
-- `jsonb $type<string[]>`).
--
-- The ADD COLUMNs use IF NOT EXISTS and the DROP TYPE stays IF EXISTS because
-- these columns were first applied by hand on the shared database before this
-- migration existed — re-running here must be a no-op there while still doing
-- the real work on a fresh database.

ALTER TABLE "bakeries" ADD COLUMN IF NOT EXISTS "notes" text;--> statement-breakpoint
ALTER TABLE "bakeries" ADD COLUMN IF NOT EXISTS "logo_url" text;--> statement-breakpoint
ALTER TABLE "bakeries" ADD COLUMN IF NOT EXISTS "gallery_images" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint

-- Constrain the gallery to a json array of at most 3 elements, each a string.
-- Drizzle's `.$type<string[]>()` is a compile-time annotation only, so without
-- this nothing at the database level would reject a 4th image or a non-string.
--
-- CHECK constraints cannot contain subqueries, so "every element is a string"
-- cannot be phrased with jsonb_array_elements. Instead the jsonpath filter
-- rebuilds the array keeping only the string elements, and containment asserts
-- nothing was dropped — if any element were a number/object/null the rebuilt
-- array would not contain the original.
ALTER TABLE "bakeries" DROP CONSTRAINT IF EXISTS "bakeries_gallery_images_shape";--> statement-breakpoint
ALTER TABLE "bakeries"
ADD CONSTRAINT "bakeries_gallery_images_shape" CHECK (
  jsonb_typeof("gallery_images") = 'array'
  AND jsonb_array_length("gallery_images") <= 3
  AND "gallery_images" <@ jsonb_path_query_array("gallery_images", '$[*] ? (@.type() == "string")')
);--> statement-breakpoint

-- Vestigial enum carrying the legacy `large_cakes` label. No column has ever
-- used it and bakery types are jsonb, constrained by migration 0009. That
-- migration already drops it, but it predates this snapshot lineage and has not
-- run everywhere, so the drop is repeated here idempotently.
DROP TYPE IF EXISTS "public"."bakery_type_enum";
