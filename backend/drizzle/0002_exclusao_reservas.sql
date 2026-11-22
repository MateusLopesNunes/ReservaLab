CREATE EXTENSION IF NOT EXISTS "btree_gist";
--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_equipment_period_excl"
EXCLUDE USING gist (
  "equipment_id" WITH =,
  tstzrange("starts_at", "ends_at", '[)') WITH &&
);
