import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// NOTE: the auto-generated diff also tried to CREATE the `messages` table + relations,
// which already exist in the DB (snapshot-chain drift from the earlier add_messages
// migration). That DDL is intentionally omitted here so this migration only applies the
// intended change — two booking columns + the 24-seat default. The committed `.json`
// snapshot still records `messages`, which reconciles the drift for future migrations.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancellation_requested_at" timestamp(3) with time zone;
    ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancellation_reason" varchar;
    ALTER TABLE "departure_inventory" ALTER COLUMN "seats_total" SET DEFAULT 24;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "cancellation_requested_at";
    ALTER TABLE "bookings" DROP COLUMN IF EXISTS "cancellation_reason";
    ALTER TABLE "departure_inventory" ALTER COLUMN "seats_total" SET DEFAULT 25;
  `)
}
