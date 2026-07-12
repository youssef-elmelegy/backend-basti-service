ALTER TABLE "orders" ADD COLUMN "basti_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "bakery_amount" numeric(10, 2) DEFAULT '0' NOT NULL;