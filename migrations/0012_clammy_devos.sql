ALTER TABLE "driver_routes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "driver_routes" CASCADE;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "driver_id" uuid NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "routes" ADD CONSTRAINT "routes_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "auth"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
