CREATE TYPE "public"."cart_type_enum" AS ENUM('big_cakes', 'small_cakes', 'others');--> statement-breakpoint
CREATE TYPE "public"."addon_category_enum" AS ENUM('balloons', 'cards', 'candles', 'decorations', 'other');--> statement-breakpoint
CREATE TYPE "public"."addon_info_type_enum" AS ENUM('color', 'number', 'letter', 'text');--> statement-breakpoint
CREATE TYPE "public"."admin_role_enum" AS ENUM('super_admin', 'admin', 'manager', 'driver');--> statement-breakpoint
CREATE TYPE "public"."bakery_type_enum" AS ENUM('large_cakes', 'small_cakes', 'others');--> statement-breakpoint
CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed_amount', 'free_shipping');--> statement-breakpoint
CREATE TYPE "public"."gender_enum" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."notification_type_enum" AS ENUM('order_update', 'order_status', 'promotion', 'system', 'review', 'new_order');--> statement-breakpoint
CREATE TYPE "public"."order_status_enum" AS ENUM('pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type_enum" AS ENUM('credit_card', 'debit_card', 'cash', 'wallet');--> statement-breakpoint
CREATE TYPE "public"."visual_key_type_enum" AS ENUM('classic_round', 'small_round', 'mini_round', 'long_round', 'classic_square', 'sheet', 'tower', 'big_heart', 'small_heart');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"phone_number" varchar(20),
	"password" varchar(255) NOT NULL,
	"otp_code" varchar(10),
	"otp_expires_at" timestamp,
	"profile_image" text,
	"fcm_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "admin_role_enum" DEFAULT 'admin' NOT NULL,
	"profile_image" text,
	"bakery_id" uuid,
	"fcm_token" text,
	"otp_code" varchar(10),
	"otp_expires_at" timestamp,
	"is_blocked" boolean DEFAULT false NOT NULL,
	"blocked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"image" varchar,
	"is_available" boolean DEFAULT true NOT NULL,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bakeries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_id" uuid NOT NULL,
	"manager_id" uuid,
	"name" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"location_description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"capacity" integer NOT NULL,
	"bakery_types" jsonb NOT NULL,
	"average_rating" numeric(3, 2) DEFAULT '0',
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bakery_id" uuid NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"image" text,
	"specialization" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"bio" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_cakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"images" jsonb NOT NULL,
	"capacity" integer NOT NULL,
	"flavor_list" jsonb NOT NULL,
	"piping_palette_list" jsonb NOT NULL,
	"tag_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"min_prep_hours" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addon_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"addon_id" uuid NOT NULL,
	"type" "addon_info_type_enum" NOT NULL,
	"label" varchar(100) NOT NULL,
	"value" varchar(100) NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "addons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"category" "addon_category_enum" NOT NULL,
	"images" jsonb NOT NULL,
	"tag_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sweets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"tag_id" uuid,
	"images" jsonb NOT NULL,
	"sizes" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"display_order" integer NOT NULL,
	"types" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" varchar(50),
	"user_id" uuid NOT NULL,
	"user_data" jsonb NOT NULL,
	"bakery_id" uuid,
	"location_id" uuid,
	"location_data" jsonb NOT NULL,
	"region_id" uuid NOT NULL,
	"region_name" varchar(100) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"final_price" numeric(10, 2) NOT NULL,
	"basti_percentage" numeric(10, 2) DEFAULT '0.20' NOT NULL,
	"delivery_amount" integer DEFAULT 10 NOT NULL,
	"addons_total" integer DEFAULT 0 NOT NULL,
	"total_capacity" integer DEFAULT 0,
	"payment_method_id" uuid,
	"payment_method_type" "payment_method_type_enum" NOT NULL,
	"payment_data" jsonb,
	"order_status" "order_status_enum",
	"delivery_note" text,
	"keep_anonymous" boolean DEFAULT false NOT NULL,
	"type" "cart_type_enum" NOT NULL,
	"assigning_date" timestamp,
	"card_message" jsonb,
	"recipient_data" jsonb,
	"wanted_delivery_date" timestamp,
	"wanted_delivery_time_slot" jsonb,
	"qa" jsonb,
	"will_deliver_at" timestamp NOT NULL,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orders_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"addon_id" uuid,
	"sweet_id" uuid,
	"predesigned_cakes_id" uuid,
	"featured_cake_id" uuid,
	"addon" jsonb,
	"sweet" jsonb,
	"predesigned_cake" jsonb,
	"featured_cake" jsonb,
	"custom_cake" jsonb,
	"quantity" integer DEFAULT 1 NOT NULL,
	"size" varchar(50),
	"flavor" varchar(100),
	"price" numeric(10, 2) NOT NULL,
	"selected_options" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "payment_method_type_enum" NOT NULL,
	"card_holder_name" varchar(255),
	"card_last_four_digits" varchar(4),
	"card_expiry_month" integer,
	"card_expiry_year" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" varchar(50) NOT NULL,
	"latitude" numeric(10, 8) NOT NULL,
	"longitude" numeric(11, 8) NOT NULL,
	"building_no" varchar(50),
	"street" varchar(255) NOT NULL,
	"area" varchar(255) NOT NULL,
	"apartment_no" varchar(50),
	"office_no" varchar(50),
	"floor" varchar(50),
	"additional_info" text,
	"type" varchar(20) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"bakery_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"review_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"featured_cake_id" uuid,
	"addon_id" uuid,
	"sweet_id" uuid,
	"predesigned_cake_id" uuid,
	"custom_cake" jsonb,
	"type" "cart_type_enum" DEFAULT 'big_cakes' NOT NULL,
	"is_included" boolean DEFAULT true NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slider_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"image_url" text NOT NULL,
	"display_order" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slider_images_display_order_unique" UNIQUE("display_order")
);
--> statement-breakpoint
CREATE TABLE "region_item_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"region_id" uuid NOT NULL,
	"offer_id" uuid,
	"addon_id" uuid,
	"featured_cake_id" uuid,
	"sweet_id" uuid,
	"decoration_id" uuid,
	"flavor_id" uuid,
	"shape_id" uuid,
	"predesigned_cake_id" uuid,
	"price" numeric(10, 2) NOT NULL,
	"sizes_prices" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "only_one_product" CHECK ((CASE WHEN addon_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN featured_cake_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN sweet_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN decoration_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN flavor_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN shape_id IS NOT NULL THEN 1 ELSE 0 END +
           CASE WHEN predesigned_cake_id IS NOT NULL THEN 1 ELSE 0 END) = 1)
);
--> statement-breakpoint
CREATE TABLE "bakery_item_stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bakery_id" uuid NOT NULL,
	"region_item_price_id" uuid NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"options" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "predesigned_cakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"thumbnail_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"tag_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "designed_cake_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"predesigned_cake_id" uuid NOT NULL,
	"shape_id" uuid NOT NULL,
	"flavor_id" uuid NOT NULL,
	"decoration_id" uuid NOT NULL,
	"frost_color_value" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shapes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"shape_url" text NOT NULL,
	"size" varchar(50) DEFAULT 'medium' NOT NULL,
	"capacity" integer,
	"order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"visual_key" "visual_key_type_enum" DEFAULT 'classic_round' NOT NULL,
	"min_prep_hours" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flavors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"flavor_url" text NOT NULL,
	"order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decorations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"tag_id" uuid,
	"decoration_url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"min_prep_hours" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shape_variant_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shape_id" uuid NOT NULL,
	"flavor_id" uuid,
	"decoration_id" uuid,
	"sliced_view_url" text NOT NULL,
	"front_view_url" text NOT NULL,
	"top_view_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"opening_hour" integer DEFAULT 10 NOT NULL,
	"closing_hour" integer DEFAULT 18 NOT NULL,
	"min_hours_to_prepare" integer DEFAULT 24 NOT NULL,
	"weekend_days" jsonb DEFAULT '[5, 6]'::jsonb NOT NULL,
	"holidays" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emergency_closures" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_open" boolean DEFAULT true NOT NULL,
	"closure_message" varchar(500),
	"basti_percentage" numeric(10, 2) DEFAULT '0.20' NOT NULL,
	"delivery_amount" integer DEFAULT 10 NOT NULL,
	"min_mini_cakes_required" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"body" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"type" "notification_type_enum" NOT NULL,
	"user_id" uuid,
	"admin_id" uuid,
	"redirect_id" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_usages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(255) NOT NULL,
	"name" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" numeric(10, 2) DEFAULT '0' NOT NULL,
	"min_order_value" integer,
	"start_date" timestamp,
	"expiry_date" timestamp,
	"usage_limit_global" integer DEFAULT 0 NOT NULL,
	"usage_limit_per_user" integer DEFAULT 0 NOT NULL,
	"region_id" uuid,
	"is_global" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"percentage" integer NOT NULL,
	"start_date" timestamp,
	"expiry_date" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bakeries" ADD CONSTRAINT "bakeries_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bakeries" ADD CONSTRAINT "bakeries_manager_id_admins_id_fk" FOREIGN KEY ("manager_id") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chefs" ADD CONSTRAINT "chefs_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addon_options" ADD CONSTRAINT "addon_options_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_sweet_id_sweets_id_fk" FOREIGN KEY ("sweet_id") REFERENCES "public"."sweets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_predesigned_cakes_id_predesigned_cakes_id_fk" FOREIGN KEY ("predesigned_cakes_id") REFERENCES "public"."predesigned_cakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_featured_cake_id_featured_cakes_id_fk" FOREIGN KEY ("featured_cake_id") REFERENCES "public"."featured_cakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_featured_cake_id_featured_cakes_id_fk" FOREIGN KEY ("featured_cake_id") REFERENCES "public"."featured_cakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_sweet_id_sweets_id_fk" FOREIGN KEY ("sweet_id") REFERENCES "public"."sweets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_predesigned_cake_id_predesigned_cakes_id_fk" FOREIGN KEY ("predesigned_cake_id") REFERENCES "public"."predesigned_cakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_item_prices" ADD CONSTRAINT "region_item_prices_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_item_prices" ADD CONSTRAINT "region_item_prices_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_item_prices" ADD CONSTRAINT "region_item_prices_addon_id_addons_id_fk" FOREIGN KEY ("addon_id") REFERENCES "public"."addons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_item_prices" ADD CONSTRAINT "region_item_prices_featured_cake_id_featured_cakes_id_fk" FOREIGN KEY ("featured_cake_id") REFERENCES "public"."featured_cakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_item_prices" ADD CONSTRAINT "region_item_prices_sweet_id_sweets_id_fk" FOREIGN KEY ("sweet_id") REFERENCES "public"."sweets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_item_prices" ADD CONSTRAINT "region_item_prices_decoration_id_decorations_id_fk" FOREIGN KEY ("decoration_id") REFERENCES "public"."decorations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_item_prices" ADD CONSTRAINT "region_item_prices_flavor_id_flavors_id_fk" FOREIGN KEY ("flavor_id") REFERENCES "public"."flavors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_item_prices" ADD CONSTRAINT "region_item_prices_shape_id_shapes_id_fk" FOREIGN KEY ("shape_id") REFERENCES "public"."shapes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "region_item_prices" ADD CONSTRAINT "region_item_prices_predesigned_cake_id_predesigned_cakes_id_fk" FOREIGN KEY ("predesigned_cake_id") REFERENCES "public"."predesigned_cakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bakery_item_stores" ADD CONSTRAINT "bakery_item_stores_bakery_id_bakeries_id_fk" FOREIGN KEY ("bakery_id") REFERENCES "public"."bakeries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bakery_item_stores" ADD CONSTRAINT "bakery_item_stores_region_item_price_id_region_item_prices_id_fk" FOREIGN KEY ("region_item_price_id") REFERENCES "public"."region_item_prices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designed_cake_configs" ADD CONSTRAINT "designed_cake_configs_predesigned_cake_id_predesigned_cakes_id_fk" FOREIGN KEY ("predesigned_cake_id") REFERENCES "public"."predesigned_cakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designed_cake_configs" ADD CONSTRAINT "designed_cake_configs_shape_id_shapes_id_fk" FOREIGN KEY ("shape_id") REFERENCES "public"."shapes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designed_cake_configs" ADD CONSTRAINT "designed_cake_configs_flavor_id_flavors_id_fk" FOREIGN KEY ("flavor_id") REFERENCES "public"."flavors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "designed_cake_configs" ADD CONSTRAINT "designed_cake_configs_decoration_id_decorations_id_fk" FOREIGN KEY ("decoration_id") REFERENCES "public"."decorations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shape_variant_images" ADD CONSTRAINT "shape_variant_images_shape_id_shapes_id_fk" FOREIGN KEY ("shape_id") REFERENCES "public"."shapes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shape_variant_images" ADD CONSTRAINT "shape_variant_images_flavor_id_flavors_id_fk" FOREIGN KEY ("flavor_id") REFERENCES "public"."flavors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shape_variant_images" ADD CONSTRAINT "shape_variant_images_decoration_id_decorations_id_fk" FOREIGN KEY ("decoration_id") REFERENCES "public"."decorations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_coupon_id_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_usages" ADD CONSTRAINT "coupon_usages_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_phone_number_idx" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admins_email_idx" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX "admins_is_blocked_idx" ON "admins" USING btree ("is_blocked");--> statement-breakpoint
CREATE INDEX "admins_bakery_id_idx" ON "admins" USING btree ("bakery_id");--> statement-breakpoint
CREATE INDEX "bakeries_region_id_idx" ON "bakeries" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "bakeries_name_idx" ON "bakeries" USING btree ("name");--> statement-breakpoint
CREATE INDEX "bakeries_manager_id_idx" ON "bakeries" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX "chefs_bakery_id_idx" ON "chefs" USING btree ("bakery_id");--> statement-breakpoint
CREATE INDEX "featured_cakes_name_idx" ON "featured_cakes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "featured_cakes_is_active_idx" ON "featured_cakes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "addon_options_addon_id_idx" ON "addon_options" USING btree ("addon_id");--> statement-breakpoint
CREATE INDEX "addons_name_idx" ON "addons" USING btree ("name");--> statement-breakpoint
CREATE INDEX "addons_category_idx" ON "addons" USING btree ("category");--> statement-breakpoint
CREATE INDEX "addons_is_active_idx" ON "addons" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "sweets_name_idx" ON "sweets" USING btree ("name");--> statement-breakpoint
CREATE INDEX "sweets_is_active_idx" ON "sweets" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "tags_name_idx" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE INDEX "tags_display_order_idx" ON "tags" USING btree ("display_order");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_bakery_id_idx" ON "orders" USING btree ("bakery_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("order_status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "payment_methods_user_id_idx" ON "payment_methods" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "locations_user_id_idx" ON "locations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_bakery_id_idx" ON "reviews" USING btree ("bakery_id");--> statement-breakpoint
CREATE INDEX "reviews_order_id_idx" ON "reviews" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "cart_items_user_id_idx" ON "cart_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cart_unique_user_featured_cake_idx" ON "cart_items" USING btree ("user_id","featured_cake_id");--> statement-breakpoint
CREATE INDEX "cart_unique_user_addon_idx" ON "cart_items" USING btree ("user_id","addon_id");--> statement-breakpoint
CREATE INDEX "cart_unique_user_sweet_idx" ON "cart_items" USING btree ("user_id","sweet_id");--> statement-breakpoint
CREATE INDEX "region_item_prices_region_id_idx" ON "region_item_prices" USING btree ("region_id");--> statement-breakpoint
CREATE INDEX "region_item_prices_offer_id_idx" ON "region_item_prices" USING btree ("offer_id");--> statement-breakpoint
CREATE INDEX "region_item_prices_addon_id_idx" ON "region_item_prices" USING btree ("addon_id");--> statement-breakpoint
CREATE INDEX "region_item_prices_featured_cake_id_idx" ON "region_item_prices" USING btree ("featured_cake_id");--> statement-breakpoint
CREATE INDEX "region_item_prices_sweet_id_idx" ON "region_item_prices" USING btree ("sweet_id");--> statement-breakpoint
CREATE INDEX "region_item_prices_decoration_id_idx" ON "region_item_prices" USING btree ("decoration_id");--> statement-breakpoint
CREATE INDEX "region_item_prices_flavor_id_idx" ON "region_item_prices" USING btree ("flavor_id");--> statement-breakpoint
CREATE INDEX "region_item_prices_shape_id_idx" ON "region_item_prices" USING btree ("shape_id");--> statement-breakpoint
CREATE INDEX "region_item_prices_predesigned_cake_id_idx" ON "region_item_prices" USING btree ("predesigned_cake_id");--> statement-breakpoint
CREATE INDEX "bakery_item_stores_bakery_id_idx" ON "bakery_item_stores" USING btree ("bakery_id");--> statement-breakpoint
CREATE INDEX "bakery_item_stores_region_item_price_id_idx" ON "bakery_item_stores" USING btree ("region_item_price_id");--> statement-breakpoint
CREATE INDEX "predesigned_cakes_name_idx" ON "predesigned_cakes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "predesigned_cakes_is_active_idx" ON "predesigned_cakes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "designed_cake_configs_predesigned_cake_id_idx" ON "designed_cake_configs" USING btree ("predesigned_cake_id");--> statement-breakpoint
CREATE INDEX "designed_cake_configs_shape_id_idx" ON "designed_cake_configs" USING btree ("shape_id");--> statement-breakpoint
CREATE INDEX "designed_cake_configs_flavor_id_idx" ON "designed_cake_configs" USING btree ("flavor_id");--> statement-breakpoint
CREATE INDEX "designed_cake_configs_decoration_id_idx" ON "designed_cake_configs" USING btree ("decoration_id");--> statement-breakpoint
CREATE INDEX "shapes_title_idx" ON "shapes" USING btree ("title");--> statement-breakpoint
CREATE INDEX "shapes_is_active_idx" ON "shapes" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "flavors_title_idx" ON "flavors" USING btree ("title");--> statement-breakpoint
CREATE INDEX "flavors_is_active_idx" ON "flavors" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "decorations_title_idx" ON "decorations" USING btree ("title");--> statement-breakpoint
CREATE INDEX "decorations_is_active_idx" ON "decorations" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "shape_variant_images_shape_id_idx" ON "shape_variant_images" USING btree ("shape_id");--> statement-breakpoint
CREATE INDEX "shape_variant_images_flavor_id_idx" ON "shape_variant_images" USING btree ("flavor_id");--> statement-breakpoint
CREATE INDEX "shape_variant_images_decoration_id_idx" ON "shape_variant_images" USING btree ("decoration_id");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_admin_id_idx" ON "notifications" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "coupon_usages_user_coupon_idx" ON "coupon_usages" USING btree ("user_id","coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_usages_global_coupon_idx" ON "coupon_usages" USING btree ("coupon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_order_coupon_idx" ON "coupon_usages" USING btree ("order_id","coupon_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_code_idx" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupon_active_dates_idx" ON "coupons" USING btree ("is_active","start_date","expiry_date");--> statement-breakpoint
CREATE INDEX "offers_name_idx" ON "offers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "offers_is_active_idx" ON "offers" USING btree ("is_active");