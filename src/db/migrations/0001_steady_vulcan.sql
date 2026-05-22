ALTER TYPE "public"."notification_type_enum" ADD VALUE 'order_cancelled_by_bakery' BEFORE 'promotion';--> statement-breakpoint
ALTER TYPE "public"."notification_type_enum" ADD VALUE 'offer';--> statement-breakpoint
ALTER TYPE "public"."notification_type_enum" ADD VALUE 'coupon';