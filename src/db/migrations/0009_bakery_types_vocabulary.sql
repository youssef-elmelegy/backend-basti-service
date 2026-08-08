-- Normalize `bakery_types` and constrain it to the current vocabulary.
--
-- `bakery_types` is jsonb. Drizzle's `.$type<Array<'big_cakes' | 'small_cakes' |
-- 'others'>>()` is a compile-time annotation only, so nothing at the database
-- level ever rejected an out-of-vocabulary value. `large_cakes` was written by
-- an earlier type vocabulary and survives in 11 rows, where it renders as an
-- unlabelled, uncoloured badge in the dashboard because no translation key or
-- badge colour is registered for it.
--
-- `large_cakes` is the legacy alias for `big_cakes` — the dashboard already
-- treats it that way when labelling — so it is rewritten rather than dropped.
--
-- Data-only + CHECK: drizzle-kit generate diffs schema and emits DDL, so it
-- will never produce the UPDATE. Hand-written on purpose.

-- 1. Rewrite the legacy alias, de-duplicating in the rows that would otherwise
--    end up with big_cakes twice (none today, but the UPDATE must be idempotent
--    and safe if such a row is created before this runs).
UPDATE "bakeries"
SET "bakery_types" = (
  SELECT jsonb_agg(DISTINCT CASE WHEN elem = 'large_cakes' THEN 'big_cakes' ELSE elem END)
  FROM jsonb_array_elements_text("bakery_types") AS elem
)
WHERE "bakery_types" @> '["large_cakes"]';

-- 2. Reject anything outside the vocabulary from here on. The column must stay
--    a non-empty json array whose every element is a known type.
--
--    CHECK constraints cannot contain subqueries, so the element test is phrased
--    with the jsonb containment operator: the full set of allowed values must
--    contain every element actually present.
ALTER TABLE "bakeries"
ADD CONSTRAINT "bakeries_bakery_types_vocabulary" CHECK (
  jsonb_typeof("bakery_types") = 'array'
  AND jsonb_array_length("bakery_types") > 0
  AND '["big_cakes", "small_cakes", "others"]'::jsonb @> "bakery_types"
);

-- 3. Drop the vestigial `bakery_type_enum`. It still carried the `large_cakes`
--    label, but no column has ever used it and no code references it — bakery
--    types are jsonb, constrained above. Leaving it would preserve the old
--    spelling in the schema for no benefit.
DROP TYPE IF EXISTS "bakery_type_enum";
