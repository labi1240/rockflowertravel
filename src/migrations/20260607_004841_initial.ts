import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_roles" AS ENUM('admin', 'operator');
  CREATE TYPE "public"."enum_routes_kind" AS ENUM('SUNRISE_EXPRESS', 'DAYTIME_CIRCUIT', 'EVENING_RETURN');
  CREATE TYPE "public"."enum_routes_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__routes_v_version_kind" AS ENUM('SUNRISE_EXPRESS', 'DAYTIME_CIRCUIT', 'EVENING_RETURN');
  CREATE TYPE "public"."enum__routes_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_fares_tier" AS ENUM('sunrise', 'daytime', 'evening');
  CREATE TYPE "public"."enum_bookings_status" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'REFUNDED', 'EXPIRED');
  CREATE TYPE "public"."enum_payments_status" AS ENUM('REQUIRES_PAYMENT', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED');
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "customers_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"first_name" varchar,
  	"last_name" varchar,
  	"phone" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "stops" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"location" geometry(Point),
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "routes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar,
  	"display_name" varchar,
  	"tier" varchar,
  	"is_premium" boolean DEFAULT false,
  	"description" varchar,
  	"kind" "enum_routes_kind",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_routes_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_routes_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_slug" varchar,
  	"version_display_name" varchar,
  	"version_tier" varchar,
  	"version_is_premium" boolean DEFAULT false,
  	"version_description" varchar,
  	"version_kind" "enum__routes_v_version_kind",
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__routes_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "schedule_templates_legs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"sequence" numeric NOT NULL,
  	"from_stop_id" integer NOT NULL,
  	"to_stop_id" integer NOT NULL,
  	"depart_min" numeric NOT NULL,
  	"arrive_min" numeric NOT NULL,
  	"bookable" boolean DEFAULT true,
  	"price_cents" numeric DEFAULT 0
  );
  
  CREATE TABLE "schedule_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"route_id" integer NOT NULL,
  	"label" varchar NOT NULL,
  	"sort_order" numeric DEFAULT 0 NOT NULL,
  	"active_from" timestamp(3) with time zone,
  	"active_until" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "fares" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"tier" "enum_fares_tier" NOT NULL,
  	"route_id" integer,
  	"route_kind" varchar,
  	"label" varchar NOT NULL,
  	"short" varchar NOT NULL,
  	"origin" varchar NOT NULL,
  	"destination" varchar NOT NULL,
  	"price_cents" numeric NOT NULL,
  	"toll_cents" numeric DEFAULT 0,
  	"round_trip" boolean DEFAULT false,
  	"premium" boolean DEFAULT false,
  	"default_time" varchar NOT NULL,
  	"note" varchar,
  	"active" boolean DEFAULT true,
  	"sort_order" numeric DEFAULT 0,
  	"sale_sale_price_cents" numeric,
  	"sale_sale_starts_at" timestamp(3) with time zone,
  	"sale_sale_ends_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vehicles" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"seat_capacity" numeric DEFAULT 25 NOT NULL,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "departure_inventory" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"route_slug" varchar NOT NULL,
  	"service_date" timestamp(3) with time zone NOT NULL,
  	"departure_time" varchar NOT NULL,
  	"seats_total" numeric DEFAULT 25 NOT NULL,
  	"seats_booked" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reference" varchar NOT NULL,
  	"customer_id" integer,
  	"status" "enum_bookings_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
  	"guest_first_name" varchar,
  	"guest_last_name" varchar,
  	"guest_email" varchar,
  	"guest_phone" varchar,
  	"route_name" varchar,
  	"route_slug" varchar,
  	"route_kind" varchar,
  	"service_date" timestamp(3) with time zone,
  	"departure_time" varchar,
  	"seats" numeric DEFAULT 1 NOT NULL,
  	"subtotal_cents" numeric NOT NULL,
  	"gst_cents" numeric NOT NULL,
  	"total_cents" numeric NOT NULL,
  	"currency" varchar DEFAULT 'CAD' NOT NULL,
  	"hold_expires_at" timestamp(3) with time zone,
  	"refunded_at" timestamp(3) with time zone,
  	"refunded_by" varchar,
  	"refund_reason" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"booking_id" integer NOT NULL,
  	"stripe_payment_intent_id" varchar,
  	"stripe_checkout_session_id" varchar,
  	"stripe_customer_id" varchar,
  	"amount_subtotal_cents" numeric NOT NULL,
  	"gst_cents" numeric NOT NULL,
  	"amount_total_cents" numeric NOT NULL,
  	"currency" varchar DEFAULT 'CAD' NOT NULL,
  	"status" "enum_payments_status" DEFAULT 'REQUIRES_PAYMENT' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"customers_id" integer,
  	"stops_id" integer,
  	"routes_id" integer,
  	"schedule_templates_id" integer,
  	"fares_id" integer,
  	"vehicles_id" integer,
  	"departure_inventory_id" integer,
  	"bookings_id" integer,
  	"payments_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"customers_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "customers_sessions" ADD CONSTRAINT "customers_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_routes_v" ADD CONSTRAINT "_routes_v_parent_id_routes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."routes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schedule_templates_legs" ADD CONSTRAINT "schedule_templates_legs_from_stop_id_stops_id_fk" FOREIGN KEY ("from_stop_id") REFERENCES "public"."stops"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schedule_templates_legs" ADD CONSTRAINT "schedule_templates_legs_to_stop_id_stops_id_fk" FOREIGN KEY ("to_stop_id") REFERENCES "public"."stops"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "schedule_templates_legs" ADD CONSTRAINT "schedule_templates_legs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."schedule_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "schedule_templates" ADD CONSTRAINT "schedule_templates_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "fares" ADD CONSTRAINT "fares_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "bookings" ADD CONSTRAINT "bookings_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stops_fk" FOREIGN KEY ("stops_id") REFERENCES "public"."stops"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_routes_fk" FOREIGN KEY ("routes_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_schedule_templates_fk" FOREIGN KEY ("schedule_templates_id") REFERENCES "public"."schedule_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_fares_fk" FOREIGN KEY ("fares_id") REFERENCES "public"."fares"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vehicles_fk" FOREIGN KEY ("vehicles_id") REFERENCES "public"."vehicles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_departure_inventory_fk" FOREIGN KEY ("departure_inventory_id") REFERENCES "public"."departure_inventory"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payments_fk" FOREIGN KEY ("payments_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "customers_sessions_order_idx" ON "customers_sessions" USING btree ("_order");
  CREATE INDEX "customers_sessions_parent_id_idx" ON "customers_sessions" USING btree ("_parent_id");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE UNIQUE INDEX "customers_email_idx" ON "customers" USING btree ("email");
  CREATE UNIQUE INDEX "stops_code_idx" ON "stops" USING btree ("code");
  CREATE INDEX "stops_updated_at_idx" ON "stops" USING btree ("updated_at");
  CREATE INDEX "stops_created_at_idx" ON "stops" USING btree ("created_at");
  CREATE UNIQUE INDEX "routes_slug_idx" ON "routes" USING btree ("slug");
  CREATE INDEX "routes_updated_at_idx" ON "routes" USING btree ("updated_at");
  CREATE INDEX "routes_created_at_idx" ON "routes" USING btree ("created_at");
  CREATE INDEX "routes__status_idx" ON "routes" USING btree ("_status");
  CREATE INDEX "_routes_v_parent_idx" ON "_routes_v" USING btree ("parent_id");
  CREATE INDEX "_routes_v_version_version_slug_idx" ON "_routes_v" USING btree ("version_slug");
  CREATE INDEX "_routes_v_version_version_updated_at_idx" ON "_routes_v" USING btree ("version_updated_at");
  CREATE INDEX "_routes_v_version_version_created_at_idx" ON "_routes_v" USING btree ("version_created_at");
  CREATE INDEX "_routes_v_version_version__status_idx" ON "_routes_v" USING btree ("version__status");
  CREATE INDEX "_routes_v_created_at_idx" ON "_routes_v" USING btree ("created_at");
  CREATE INDEX "_routes_v_updated_at_idx" ON "_routes_v" USING btree ("updated_at");
  CREATE INDEX "_routes_v_latest_idx" ON "_routes_v" USING btree ("latest");
  CREATE INDEX "schedule_templates_legs_order_idx" ON "schedule_templates_legs" USING btree ("_order");
  CREATE INDEX "schedule_templates_legs_parent_id_idx" ON "schedule_templates_legs" USING btree ("_parent_id");
  CREATE INDEX "schedule_templates_legs_from_stop_idx" ON "schedule_templates_legs" USING btree ("from_stop_id");
  CREATE INDEX "schedule_templates_legs_to_stop_idx" ON "schedule_templates_legs" USING btree ("to_stop_id");
  CREATE INDEX "schedule_templates_route_idx" ON "schedule_templates" USING btree ("route_id");
  CREATE INDEX "schedule_templates_updated_at_idx" ON "schedule_templates" USING btree ("updated_at");
  CREATE INDEX "schedule_templates_created_at_idx" ON "schedule_templates" USING btree ("created_at");
  CREATE UNIQUE INDEX "fares_slug_idx" ON "fares" USING btree ("slug");
  CREATE INDEX "fares_tier_idx" ON "fares" USING btree ("tier");
  CREATE INDEX "fares_route_idx" ON "fares" USING btree ("route_id");
  CREATE INDEX "fares_sort_order_idx" ON "fares" USING btree ("sort_order");
  CREATE INDEX "fares_updated_at_idx" ON "fares" USING btree ("updated_at");
  CREATE INDEX "fares_created_at_idx" ON "fares" USING btree ("created_at");
  CREATE UNIQUE INDEX "vehicles_code_idx" ON "vehicles" USING btree ("code");
  CREATE INDEX "vehicles_updated_at_idx" ON "vehicles" USING btree ("updated_at");
  CREATE INDEX "vehicles_created_at_idx" ON "vehicles" USING btree ("created_at");
  CREATE INDEX "departure_inventory_route_slug_idx" ON "departure_inventory" USING btree ("route_slug");
  CREATE INDEX "departure_inventory_updated_at_idx" ON "departure_inventory" USING btree ("updated_at");
  CREATE INDEX "departure_inventory_created_at_idx" ON "departure_inventory" USING btree ("created_at");
  CREATE UNIQUE INDEX "routeSlug_serviceDate_departureTime_idx" ON "departure_inventory" USING btree ("route_slug","service_date","departure_time");
  CREATE INDEX "serviceDate_idx" ON "departure_inventory" USING btree ("service_date");
  CREATE UNIQUE INDEX "bookings_reference_idx" ON "bookings" USING btree ("reference");
  CREATE INDEX "bookings_customer_idx" ON "bookings" USING btree ("customer_id");
  CREATE INDEX "bookings_route_slug_idx" ON "bookings" USING btree ("route_slug");
  CREATE INDEX "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
  CREATE INDEX "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
  CREATE INDEX "status_holdExpiresAt_idx" ON "bookings" USING btree ("status","hold_expires_at");
  CREATE INDEX "serviceDate_1_idx" ON "bookings" USING btree ("service_date");
  CREATE INDEX "guestEmail_idx" ON "bookings" USING btree ("guest_email");
  CREATE UNIQUE INDEX "payments_booking_idx" ON "payments" USING btree ("booking_id");
  CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_idx" ON "payments" USING btree ("stripe_payment_intent_id");
  CREATE UNIQUE INDEX "payments_stripe_checkout_session_id_idx" ON "payments" USING btree ("stripe_checkout_session_id");
  CREATE INDEX "payments_updated_at_idx" ON "payments" USING btree ("updated_at");
  CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_stops_id_idx" ON "payload_locked_documents_rels" USING btree ("stops_id");
  CREATE INDEX "payload_locked_documents_rels_routes_id_idx" ON "payload_locked_documents_rels" USING btree ("routes_id");
  CREATE INDEX "payload_locked_documents_rels_schedule_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("schedule_templates_id");
  CREATE INDEX "payload_locked_documents_rels_fares_id_idx" ON "payload_locked_documents_rels" USING btree ("fares_id");
  CREATE INDEX "payload_locked_documents_rels_vehicles_id_idx" ON "payload_locked_documents_rels" USING btree ("vehicles_id");
  CREATE INDEX "payload_locked_documents_rels_departure_inventory_id_idx" ON "payload_locked_documents_rels" USING btree ("departure_inventory_id");
  CREATE INDEX "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");
  CREATE INDEX "payload_locked_documents_rels_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("payments_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_preferences_rels_customers_id_idx" ON "payload_preferences_rels" USING btree ("customers_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "customers_sessions" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "stops" CASCADE;
  DROP TABLE "routes" CASCADE;
  DROP TABLE "_routes_v" CASCADE;
  DROP TABLE "schedule_templates_legs" CASCADE;
  DROP TABLE "schedule_templates" CASCADE;
  DROP TABLE "fares" CASCADE;
  DROP TABLE "vehicles" CASCADE;
  DROP TABLE "departure_inventory" CASCADE;
  DROP TABLE "bookings" CASCADE;
  DROP TABLE "payments" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_routes_kind";
  DROP TYPE "public"."enum_routes_status";
  DROP TYPE "public"."enum__routes_v_version_kind";
  DROP TYPE "public"."enum__routes_v_version_status";
  DROP TYPE "public"."enum_fares_tier";
  DROP TYPE "public"."enum_bookings_status";
  DROP TYPE "public"."enum_payments_status";`)
}
