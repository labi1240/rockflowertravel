import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "booking_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"pause_bookings" boolean DEFAULT false,
  	"pause_message" varchar DEFAULT 'Bookings are temporarily suspended. We are currently performing maintenance. Please check back later.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "vehicles" ALTER COLUMN "seat_capacity" SET DEFAULT 24;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "booking_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "booking_settings" CASCADE;
  ALTER TABLE "vehicles" ALTER COLUMN "seat_capacity" SET DEFAULT 25;`)
}
