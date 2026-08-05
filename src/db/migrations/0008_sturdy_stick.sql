ALTER TABLE "slider_images" ADD COLUMN "tag_id" uuid;--> statement-breakpoint
ALTER TABLE "slider_images" ADD COLUMN "is_hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "slider_images" ADD CONSTRAINT "slider_images_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;