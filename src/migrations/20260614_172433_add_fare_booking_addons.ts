import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "fares_add_ons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"price_cents" numeric NOT NULL,
  	"active" boolean DEFAULT true,
  	"description" varchar
  );
  
  CREATE TABLE "bookings_add_ons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"label" varchar,
  	"price_cents" numeric
  );
  
  ALTER TABLE "fares_add_ons" ADD CONSTRAINT "fares_add_ons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."fares"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "bookings_add_ons" ADD CONSTRAINT "bookings_add_ons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "fares_add_ons_order_idx" ON "fares_add_ons" USING btree ("_order");
  CREATE INDEX "fares_add_ons_parent_id_idx" ON "fares_add_ons" USING btree ("_parent_id");
  CREATE INDEX "bookings_add_ons_order_idx" ON "bookings_add_ons" USING btree ("_order");
  CREATE INDEX "bookings_add_ons_parent_id_idx" ON "bookings_add_ons" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "fares_add_ons" CASCADE;
  DROP TABLE "bookings_add_ons" CASCADE;`)
}
