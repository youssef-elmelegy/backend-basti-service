-- Sentinel "deleted user" row.
--
-- Account deletion anonymizes instead of cascading: orders, reviews and
-- coupon_usages are repointed at this row before the real user is removed, so
-- historical records (and the revenue totals derived from them) survive while
-- the deleted user's PII does not. Referenced from code as DELETED_USER.ID.
--
-- Data-only migration: drizzle-kit generate diffs schema and emits DDL, so it
-- will never produce this INSERT. It is hand-written on purpose.
--
-- The account is unusable by design: `password` holds a sentinel string rather
-- than a bcrypt hash, so bcrypt.compare can never return true for it, and the
-- reserved .invalid TLD (RFC 2606) cannot receive a password reset.
INSERT INTO "users" (
  "id",
  "first_name",
  "last_name",
  "email",
  "is_email_verified",
  "phone_number",
  "password",
  "language"
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Deleted',
  'User',
  'deleted-user@deleted.invalid',
  false,
  NULL,
  'ACCOUNT_DELETED_NO_LOGIN',
  'ar'
) ON CONFLICT ("id") DO NOTHING;
