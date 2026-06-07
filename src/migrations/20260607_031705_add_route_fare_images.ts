import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "routes" ADD COLUMN "hero_image_id" integer;
  ALTER TABLE "_routes_v" ADD COLUMN "version_hero_image_id" integer;
  ALTER TABLE "fares" ADD COLUMN "image_id" integer;
  ALTER TABLE "routes" ADD CONSTRAINT "routes_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_routes_v" ADD CONSTRAINT "_routes_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "fares" ADD CONSTRAINT "fares_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "routes_hero_image_idx" ON "routes" USING btree ("hero_image_id");
  CREATE INDEX "_routes_v_version_version_hero_image_idx" ON "_routes_v" USING btree ("version_hero_image_id");
  CREATE INDEX "fares_image_idx" ON "fares" USING btree ("image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "routes" DROP CONSTRAINT "routes_hero_image_id_media_id_fk";
  
  ALTER TABLE "_routes_v" DROP CONSTRAINT "_routes_v_version_hero_image_id_media_id_fk";
  
  ALTER TABLE "fares" DROP CONSTRAINT "fares_image_id_media_id_fk";
  
  DROP INDEX "routes_hero_image_idx";
  DROP INDEX "_routes_v_version_version_hero_image_idx";
  DROP INDEX "fares_image_idx";
  ALTER TABLE "routes" DROP COLUMN "hero_image_id";
  ALTER TABLE "_routes_v" DROP COLUMN "version_hero_image_id";
  ALTER TABLE "fares" DROP COLUMN "image_id";`)
}
