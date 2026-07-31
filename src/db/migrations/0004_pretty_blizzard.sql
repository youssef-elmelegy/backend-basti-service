CREATE TYPE "public"."language_enum" AS ENUM('en', 'ar');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language" "language_enum" DEFAULT 'ar' NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "language" "language_enum" DEFAULT 'ar' NOT NULL;