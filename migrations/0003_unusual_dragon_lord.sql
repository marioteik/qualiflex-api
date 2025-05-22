ALTER TABLE "shipments" ADD COLUMN "refused_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "system_estimation" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "informed_estimation" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipments_confirmed_at_idx" ON "shipments" USING btree ("confirmed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipments_delivered_at_idx" ON "shipments" USING btree ("delivered_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipments_finished_at_idx" ON "shipments" USING btree ("finished_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "shipments_collected_at_idx" ON "shipments" USING btree ("collected_at");