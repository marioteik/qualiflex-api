CREATE TABLE IF NOT EXISTS "driver_position" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"driver_id" uuid,
	"lat" numeric(9, 6),
	"lng" numeric(9, 6),
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "driver_position" ADD CONSTRAINT "driver_position_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
