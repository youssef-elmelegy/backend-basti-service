ALTER TABLE "order_items" DROP CONSTRAINT "order_items_sweet_id_sweets_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_predesigned_cakes_id_predesigned_cakes_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_featured_cake_id_featured_cakes_id_fk";
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sweet_id_sweets_id_fk" FOREIGN KEY ("sweet_id") REFERENCES "public"."sweets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_predesigned_cakes_id_predesigned_cakes_id_fk" FOREIGN KEY ("predesigned_cakes_id") REFERENCES "public"."predesigned_cakes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_featured_cake_id_featured_cakes_id_fk" FOREIGN KEY ("featured_cake_id") REFERENCES "public"."featured_cakes"("id") ON DELETE set null ON UPDATE no action;