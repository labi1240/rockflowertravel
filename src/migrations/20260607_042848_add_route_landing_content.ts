import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_routes_blocks_feature_grid_features_icon" AS ENUM('check', 'clock', 'pin', 'calendar', 'shield', 'star');
  CREATE TYPE "public"."enum__routes_v_blocks_feature_grid_features_icon" AS ENUM('check', 'clock', 'pin', 'calendar', 'shield', 'star');
  CREATE TABLE "routes_blocks_highlights_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "routes_blocks_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "routes_blocks_feature_grid_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"icon" "enum_routes_blocks_feature_grid_features_icon" DEFAULT 'check',
  	"title" varchar,
  	"body" varchar
  );
  
  CREATE TABLE "routes_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "routes_blocks_inclusions_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "routes_blocks_inclusions_excludes" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "routes_blocks_inclusions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "routes_blocks_itinerary_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"duration" varchar
  );
  
  CREATE TABLE "routes_blocks_itinerary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "routes_blocks_route_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "routes_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar
  );
  
  CREATE TABLE "routes_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "routes_blocks_things_to_do_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "routes_blocks_things_to_do" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "routes_blocks_testimonials_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"location" varchar,
  	"rating" numeric DEFAULT 5,
  	"text" varchar
  );
  
  CREATE TABLE "routes_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "routes_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "routes_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "routes_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "routes_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"button_label" varchar DEFAULT 'Book now',
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_highlights_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_feature_grid_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"icon" "enum__routes_v_blocks_feature_grid_features_icon" DEFAULT 'check',
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_feature_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_inclusions_includes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_inclusions_excludes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_inclusions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_itinerary_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"duration" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_itinerary" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_route_map" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"subheading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer,
  	"caption" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_things_to_do_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_things_to_do" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_testimonials_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"location" varchar,
  	"rating" numeric DEFAULT 5,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_routes_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"button_label" varchar DEFAULT 'Book now',
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "routes" ADD COLUMN "seo_slug" varchar;
  ALTER TABLE "routes" ADD COLUMN "seo_meta_title" varchar;
  ALTER TABLE "routes" ADD COLUMN "seo_meta_description" varchar;
  ALTER TABLE "routes" ADD COLUMN "seo_og_image_id" integer;
  ALTER TABLE "routes" ADD COLUMN "hero_badge" varchar;
  ALTER TABLE "routes" ADD COLUMN "hero_headline" varchar;
  ALTER TABLE "routes" ADD COLUMN "hero_subheadline" varchar;
  ALTER TABLE "routes" ADD COLUMN "hero_rating_value" numeric;
  ALTER TABLE "routes" ADD COLUMN "hero_rating_count" numeric;
  ALTER TABLE "routes" ADD COLUMN "hero_rating_source" varchar;
  ALTER TABLE "_routes_v" ADD COLUMN "version_seo_slug" varchar;
  ALTER TABLE "_routes_v" ADD COLUMN "version_seo_meta_title" varchar;
  ALTER TABLE "_routes_v" ADD COLUMN "version_seo_meta_description" varchar;
  ALTER TABLE "_routes_v" ADD COLUMN "version_seo_og_image_id" integer;
  ALTER TABLE "_routes_v" ADD COLUMN "version_hero_badge" varchar;
  ALTER TABLE "_routes_v" ADD COLUMN "version_hero_headline" varchar;
  ALTER TABLE "_routes_v" ADD COLUMN "version_hero_subheadline" varchar;
  ALTER TABLE "_routes_v" ADD COLUMN "version_hero_rating_value" numeric;
  ALTER TABLE "_routes_v" ADD COLUMN "version_hero_rating_count" numeric;
  ALTER TABLE "_routes_v" ADD COLUMN "version_hero_rating_source" varchar;
  ALTER TABLE "routes_blocks_highlights_items" ADD CONSTRAINT "routes_blocks_highlights_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes_blocks_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_highlights" ADD CONSTRAINT "routes_blocks_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_feature_grid_features" ADD CONSTRAINT "routes_blocks_feature_grid_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_feature_grid" ADD CONSTRAINT "routes_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_inclusions_includes" ADD CONSTRAINT "routes_blocks_inclusions_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes_blocks_inclusions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_inclusions_excludes" ADD CONSTRAINT "routes_blocks_inclusions_excludes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes_blocks_inclusions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_inclusions" ADD CONSTRAINT "routes_blocks_inclusions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_itinerary_steps" ADD CONSTRAINT "routes_blocks_itinerary_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes_blocks_itinerary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_itinerary" ADD CONSTRAINT "routes_blocks_itinerary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_route_map" ADD CONSTRAINT "routes_blocks_route_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_gallery_images" ADD CONSTRAINT "routes_blocks_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "routes_blocks_gallery_images" ADD CONSTRAINT "routes_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_gallery" ADD CONSTRAINT "routes_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_things_to_do_items" ADD CONSTRAINT "routes_blocks_things_to_do_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes_blocks_things_to_do"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_things_to_do" ADD CONSTRAINT "routes_blocks_things_to_do_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "routes_blocks_things_to_do" ADD CONSTRAINT "routes_blocks_things_to_do_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_testimonials_reviews" ADD CONSTRAINT "routes_blocks_testimonials_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_testimonials" ADD CONSTRAINT "routes_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_faq_items" ADD CONSTRAINT "routes_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_faq" ADD CONSTRAINT "routes_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_rich_text" ADD CONSTRAINT "routes_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "routes_blocks_cta" ADD CONSTRAINT "routes_blocks_cta_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "routes_blocks_cta" ADD CONSTRAINT "routes_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_highlights_items" ADD CONSTRAINT "_routes_v_blocks_highlights_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v_blocks_highlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_highlights" ADD CONSTRAINT "_routes_v_blocks_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_feature_grid_features" ADD CONSTRAINT "_routes_v_blocks_feature_grid_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v_blocks_feature_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_feature_grid" ADD CONSTRAINT "_routes_v_blocks_feature_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_inclusions_includes" ADD CONSTRAINT "_routes_v_blocks_inclusions_includes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v_blocks_inclusions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_inclusions_excludes" ADD CONSTRAINT "_routes_v_blocks_inclusions_excludes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v_blocks_inclusions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_inclusions" ADD CONSTRAINT "_routes_v_blocks_inclusions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_itinerary_steps" ADD CONSTRAINT "_routes_v_blocks_itinerary_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v_blocks_itinerary"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_itinerary" ADD CONSTRAINT "_routes_v_blocks_itinerary_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_route_map" ADD CONSTRAINT "_routes_v_blocks_route_map_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_gallery_images" ADD CONSTRAINT "_routes_v_blocks_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_gallery_images" ADD CONSTRAINT "_routes_v_blocks_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v_blocks_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_gallery" ADD CONSTRAINT "_routes_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_things_to_do_items" ADD CONSTRAINT "_routes_v_blocks_things_to_do_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v_blocks_things_to_do"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_things_to_do" ADD CONSTRAINT "_routes_v_blocks_things_to_do_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_things_to_do" ADD CONSTRAINT "_routes_v_blocks_things_to_do_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_testimonials_reviews" ADD CONSTRAINT "_routes_v_blocks_testimonials_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_testimonials" ADD CONSTRAINT "_routes_v_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_faq_items" ADD CONSTRAINT "_routes_v_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_faq" ADD CONSTRAINT "_routes_v_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_rich_text" ADD CONSTRAINT "_routes_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_cta" ADD CONSTRAINT "_routes_v_blocks_cta_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_routes_v_blocks_cta" ADD CONSTRAINT "_routes_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_routes_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "routes_blocks_highlights_items_order_idx" ON "routes_blocks_highlights_items" USING btree ("_order");
  CREATE INDEX "routes_blocks_highlights_items_parent_id_idx" ON "routes_blocks_highlights_items" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_highlights_order_idx" ON "routes_blocks_highlights" USING btree ("_order");
  CREATE INDEX "routes_blocks_highlights_parent_id_idx" ON "routes_blocks_highlights" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_highlights_path_idx" ON "routes_blocks_highlights" USING btree ("_path");
  CREATE INDEX "routes_blocks_feature_grid_features_order_idx" ON "routes_blocks_feature_grid_features" USING btree ("_order");
  CREATE INDEX "routes_blocks_feature_grid_features_parent_id_idx" ON "routes_blocks_feature_grid_features" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_feature_grid_order_idx" ON "routes_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "routes_blocks_feature_grid_parent_id_idx" ON "routes_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_feature_grid_path_idx" ON "routes_blocks_feature_grid" USING btree ("_path");
  CREATE INDEX "routes_blocks_inclusions_includes_order_idx" ON "routes_blocks_inclusions_includes" USING btree ("_order");
  CREATE INDEX "routes_blocks_inclusions_includes_parent_id_idx" ON "routes_blocks_inclusions_includes" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_inclusions_excludes_order_idx" ON "routes_blocks_inclusions_excludes" USING btree ("_order");
  CREATE INDEX "routes_blocks_inclusions_excludes_parent_id_idx" ON "routes_blocks_inclusions_excludes" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_inclusions_order_idx" ON "routes_blocks_inclusions" USING btree ("_order");
  CREATE INDEX "routes_blocks_inclusions_parent_id_idx" ON "routes_blocks_inclusions" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_inclusions_path_idx" ON "routes_blocks_inclusions" USING btree ("_path");
  CREATE INDEX "routes_blocks_itinerary_steps_order_idx" ON "routes_blocks_itinerary_steps" USING btree ("_order");
  CREATE INDEX "routes_blocks_itinerary_steps_parent_id_idx" ON "routes_blocks_itinerary_steps" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_itinerary_order_idx" ON "routes_blocks_itinerary" USING btree ("_order");
  CREATE INDEX "routes_blocks_itinerary_parent_id_idx" ON "routes_blocks_itinerary" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_itinerary_path_idx" ON "routes_blocks_itinerary" USING btree ("_path");
  CREATE INDEX "routes_blocks_route_map_order_idx" ON "routes_blocks_route_map" USING btree ("_order");
  CREATE INDEX "routes_blocks_route_map_parent_id_idx" ON "routes_blocks_route_map" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_route_map_path_idx" ON "routes_blocks_route_map" USING btree ("_path");
  CREATE INDEX "routes_blocks_gallery_images_order_idx" ON "routes_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "routes_blocks_gallery_images_parent_id_idx" ON "routes_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_gallery_images_image_idx" ON "routes_blocks_gallery_images" USING btree ("image_id");
  CREATE INDEX "routes_blocks_gallery_order_idx" ON "routes_blocks_gallery" USING btree ("_order");
  CREATE INDEX "routes_blocks_gallery_parent_id_idx" ON "routes_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_gallery_path_idx" ON "routes_blocks_gallery" USING btree ("_path");
  CREATE INDEX "routes_blocks_things_to_do_items_order_idx" ON "routes_blocks_things_to_do_items" USING btree ("_order");
  CREATE INDEX "routes_blocks_things_to_do_items_parent_id_idx" ON "routes_blocks_things_to_do_items" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_things_to_do_order_idx" ON "routes_blocks_things_to_do" USING btree ("_order");
  CREATE INDEX "routes_blocks_things_to_do_parent_id_idx" ON "routes_blocks_things_to_do" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_things_to_do_path_idx" ON "routes_blocks_things_to_do" USING btree ("_path");
  CREATE INDEX "routes_blocks_things_to_do_image_idx" ON "routes_blocks_things_to_do" USING btree ("image_id");
  CREATE INDEX "routes_blocks_testimonials_reviews_order_idx" ON "routes_blocks_testimonials_reviews" USING btree ("_order");
  CREATE INDEX "routes_blocks_testimonials_reviews_parent_id_idx" ON "routes_blocks_testimonials_reviews" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_testimonials_order_idx" ON "routes_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "routes_blocks_testimonials_parent_id_idx" ON "routes_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_testimonials_path_idx" ON "routes_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "routes_blocks_faq_items_order_idx" ON "routes_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "routes_blocks_faq_items_parent_id_idx" ON "routes_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_faq_order_idx" ON "routes_blocks_faq" USING btree ("_order");
  CREATE INDEX "routes_blocks_faq_parent_id_idx" ON "routes_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_faq_path_idx" ON "routes_blocks_faq" USING btree ("_path");
  CREATE INDEX "routes_blocks_rich_text_order_idx" ON "routes_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "routes_blocks_rich_text_parent_id_idx" ON "routes_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_rich_text_path_idx" ON "routes_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "routes_blocks_cta_order_idx" ON "routes_blocks_cta" USING btree ("_order");
  CREATE INDEX "routes_blocks_cta_parent_id_idx" ON "routes_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "routes_blocks_cta_path_idx" ON "routes_blocks_cta" USING btree ("_path");
  CREATE INDEX "routes_blocks_cta_image_idx" ON "routes_blocks_cta" USING btree ("image_id");
  CREATE INDEX "_routes_v_blocks_highlights_items_order_idx" ON "_routes_v_blocks_highlights_items" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_highlights_items_parent_id_idx" ON "_routes_v_blocks_highlights_items" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_highlights_order_idx" ON "_routes_v_blocks_highlights" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_highlights_parent_id_idx" ON "_routes_v_blocks_highlights" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_highlights_path_idx" ON "_routes_v_blocks_highlights" USING btree ("_path");
  CREATE INDEX "_routes_v_blocks_feature_grid_features_order_idx" ON "_routes_v_blocks_feature_grid_features" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_feature_grid_features_parent_id_idx" ON "_routes_v_blocks_feature_grid_features" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_feature_grid_order_idx" ON "_routes_v_blocks_feature_grid" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_feature_grid_parent_id_idx" ON "_routes_v_blocks_feature_grid" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_feature_grid_path_idx" ON "_routes_v_blocks_feature_grid" USING btree ("_path");
  CREATE INDEX "_routes_v_blocks_inclusions_includes_order_idx" ON "_routes_v_blocks_inclusions_includes" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_inclusions_includes_parent_id_idx" ON "_routes_v_blocks_inclusions_includes" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_inclusions_excludes_order_idx" ON "_routes_v_blocks_inclusions_excludes" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_inclusions_excludes_parent_id_idx" ON "_routes_v_blocks_inclusions_excludes" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_inclusions_order_idx" ON "_routes_v_blocks_inclusions" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_inclusions_parent_id_idx" ON "_routes_v_blocks_inclusions" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_inclusions_path_idx" ON "_routes_v_blocks_inclusions" USING btree ("_path");
  CREATE INDEX "_routes_v_blocks_itinerary_steps_order_idx" ON "_routes_v_blocks_itinerary_steps" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_itinerary_steps_parent_id_idx" ON "_routes_v_blocks_itinerary_steps" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_itinerary_order_idx" ON "_routes_v_blocks_itinerary" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_itinerary_parent_id_idx" ON "_routes_v_blocks_itinerary" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_itinerary_path_idx" ON "_routes_v_blocks_itinerary" USING btree ("_path");
  CREATE INDEX "_routes_v_blocks_route_map_order_idx" ON "_routes_v_blocks_route_map" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_route_map_parent_id_idx" ON "_routes_v_blocks_route_map" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_route_map_path_idx" ON "_routes_v_blocks_route_map" USING btree ("_path");
  CREATE INDEX "_routes_v_blocks_gallery_images_order_idx" ON "_routes_v_blocks_gallery_images" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_gallery_images_parent_id_idx" ON "_routes_v_blocks_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_gallery_images_image_idx" ON "_routes_v_blocks_gallery_images" USING btree ("image_id");
  CREATE INDEX "_routes_v_blocks_gallery_order_idx" ON "_routes_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_gallery_parent_id_idx" ON "_routes_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_gallery_path_idx" ON "_routes_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_routes_v_blocks_things_to_do_items_order_idx" ON "_routes_v_blocks_things_to_do_items" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_things_to_do_items_parent_id_idx" ON "_routes_v_blocks_things_to_do_items" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_things_to_do_order_idx" ON "_routes_v_blocks_things_to_do" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_things_to_do_parent_id_idx" ON "_routes_v_blocks_things_to_do" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_things_to_do_path_idx" ON "_routes_v_blocks_things_to_do" USING btree ("_path");
  CREATE INDEX "_routes_v_blocks_things_to_do_image_idx" ON "_routes_v_blocks_things_to_do" USING btree ("image_id");
  CREATE INDEX "_routes_v_blocks_testimonials_reviews_order_idx" ON "_routes_v_blocks_testimonials_reviews" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_testimonials_reviews_parent_id_idx" ON "_routes_v_blocks_testimonials_reviews" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_testimonials_order_idx" ON "_routes_v_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_testimonials_parent_id_idx" ON "_routes_v_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_testimonials_path_idx" ON "_routes_v_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "_routes_v_blocks_faq_items_order_idx" ON "_routes_v_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_faq_items_parent_id_idx" ON "_routes_v_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_faq_order_idx" ON "_routes_v_blocks_faq" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_faq_parent_id_idx" ON "_routes_v_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_faq_path_idx" ON "_routes_v_blocks_faq" USING btree ("_path");
  CREATE INDEX "_routes_v_blocks_rich_text_order_idx" ON "_routes_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_rich_text_parent_id_idx" ON "_routes_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_rich_text_path_idx" ON "_routes_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_routes_v_blocks_cta_order_idx" ON "_routes_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_routes_v_blocks_cta_parent_id_idx" ON "_routes_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_routes_v_blocks_cta_path_idx" ON "_routes_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_routes_v_blocks_cta_image_idx" ON "_routes_v_blocks_cta" USING btree ("image_id");
  ALTER TABLE "routes" ADD CONSTRAINT "routes_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_routes_v" ADD CONSTRAINT "_routes_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "routes_seo_slug_idx" ON "routes" USING btree ("seo_slug");
  CREATE INDEX "routes_seo_seo_og_image_idx" ON "routes" USING btree ("seo_og_image_id");
  CREATE INDEX "_routes_v_version_version_seo_slug_idx" ON "_routes_v" USING btree ("version_seo_slug");
  CREATE INDEX "_routes_v_version_seo_version_seo_og_image_idx" ON "_routes_v" USING btree ("version_seo_og_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "routes_blocks_highlights_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_feature_grid_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_feature_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_inclusions_includes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_inclusions_excludes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_inclusions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_itinerary_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_itinerary" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_route_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_things_to_do_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_things_to_do" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_testimonials_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "routes_blocks_cta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_highlights_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_highlights" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_feature_grid_features" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_feature_grid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_inclusions_includes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_inclusions_excludes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_inclusions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_itinerary_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_itinerary" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_route_map" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_things_to_do_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_things_to_do" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_testimonials_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_rich_text" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_routes_v_blocks_cta" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "routes_blocks_highlights_items" CASCADE;
  DROP TABLE "routes_blocks_highlights" CASCADE;
  DROP TABLE "routes_blocks_feature_grid_features" CASCADE;
  DROP TABLE "routes_blocks_feature_grid" CASCADE;
  DROP TABLE "routes_blocks_inclusions_includes" CASCADE;
  DROP TABLE "routes_blocks_inclusions_excludes" CASCADE;
  DROP TABLE "routes_blocks_inclusions" CASCADE;
  DROP TABLE "routes_blocks_itinerary_steps" CASCADE;
  DROP TABLE "routes_blocks_itinerary" CASCADE;
  DROP TABLE "routes_blocks_route_map" CASCADE;
  DROP TABLE "routes_blocks_gallery_images" CASCADE;
  DROP TABLE "routes_blocks_gallery" CASCADE;
  DROP TABLE "routes_blocks_things_to_do_items" CASCADE;
  DROP TABLE "routes_blocks_things_to_do" CASCADE;
  DROP TABLE "routes_blocks_testimonials_reviews" CASCADE;
  DROP TABLE "routes_blocks_testimonials" CASCADE;
  DROP TABLE "routes_blocks_faq_items" CASCADE;
  DROP TABLE "routes_blocks_faq" CASCADE;
  DROP TABLE "routes_blocks_rich_text" CASCADE;
  DROP TABLE "routes_blocks_cta" CASCADE;
  DROP TABLE "_routes_v_blocks_highlights_items" CASCADE;
  DROP TABLE "_routes_v_blocks_highlights" CASCADE;
  DROP TABLE "_routes_v_blocks_feature_grid_features" CASCADE;
  DROP TABLE "_routes_v_blocks_feature_grid" CASCADE;
  DROP TABLE "_routes_v_blocks_inclusions_includes" CASCADE;
  DROP TABLE "_routes_v_blocks_inclusions_excludes" CASCADE;
  DROP TABLE "_routes_v_blocks_inclusions" CASCADE;
  DROP TABLE "_routes_v_blocks_itinerary_steps" CASCADE;
  DROP TABLE "_routes_v_blocks_itinerary" CASCADE;
  DROP TABLE "_routes_v_blocks_route_map" CASCADE;
  DROP TABLE "_routes_v_blocks_gallery_images" CASCADE;
  DROP TABLE "_routes_v_blocks_gallery" CASCADE;
  DROP TABLE "_routes_v_blocks_things_to_do_items" CASCADE;
  DROP TABLE "_routes_v_blocks_things_to_do" CASCADE;
  DROP TABLE "_routes_v_blocks_testimonials_reviews" CASCADE;
  DROP TABLE "_routes_v_blocks_testimonials" CASCADE;
  DROP TABLE "_routes_v_blocks_faq_items" CASCADE;
  DROP TABLE "_routes_v_blocks_faq" CASCADE;
  DROP TABLE "_routes_v_blocks_rich_text" CASCADE;
  DROP TABLE "_routes_v_blocks_cta" CASCADE;
  ALTER TABLE "routes" DROP CONSTRAINT "routes_seo_og_image_id_media_id_fk";
  
  ALTER TABLE "_routes_v" DROP CONSTRAINT "_routes_v_version_seo_og_image_id_media_id_fk";
  
  DROP INDEX "routes_seo_slug_idx";
  DROP INDEX "routes_seo_seo_og_image_idx";
  DROP INDEX "_routes_v_version_version_seo_slug_idx";
  DROP INDEX "_routes_v_version_seo_version_seo_og_image_idx";
  ALTER TABLE "routes" DROP COLUMN "seo_slug";
  ALTER TABLE "routes" DROP COLUMN "seo_meta_title";
  ALTER TABLE "routes" DROP COLUMN "seo_meta_description";
  ALTER TABLE "routes" DROP COLUMN "seo_og_image_id";
  ALTER TABLE "routes" DROP COLUMN "hero_badge";
  ALTER TABLE "routes" DROP COLUMN "hero_headline";
  ALTER TABLE "routes" DROP COLUMN "hero_subheadline";
  ALTER TABLE "routes" DROP COLUMN "hero_rating_value";
  ALTER TABLE "routes" DROP COLUMN "hero_rating_count";
  ALTER TABLE "routes" DROP COLUMN "hero_rating_source";
  ALTER TABLE "_routes_v" DROP COLUMN "version_seo_slug";
  ALTER TABLE "_routes_v" DROP COLUMN "version_seo_meta_title";
  ALTER TABLE "_routes_v" DROP COLUMN "version_seo_meta_description";
  ALTER TABLE "_routes_v" DROP COLUMN "version_seo_og_image_id";
  ALTER TABLE "_routes_v" DROP COLUMN "version_hero_badge";
  ALTER TABLE "_routes_v" DROP COLUMN "version_hero_headline";
  ALTER TABLE "_routes_v" DROP COLUMN "version_hero_subheadline";
  ALTER TABLE "_routes_v" DROP COLUMN "version_hero_rating_value";
  ALTER TABLE "_routes_v" DROP COLUMN "version_hero_rating_count";
  ALTER TABLE "_routes_v" DROP COLUMN "version_hero_rating_source";
  DROP TYPE "public"."enum_routes_blocks_feature_grid_features_icon";
  DROP TYPE "public"."enum__routes_v_blocks_feature_grid_features_icon";`)
}
