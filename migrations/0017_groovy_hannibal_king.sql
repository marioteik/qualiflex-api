CREATE TABLE IF NOT EXISTS "productions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_item_id" uuid NOT NULL,
	"produced_quantity" numeric NOT NULL,
	"seamstress_id" uuid NOT NULL,
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "shipment_items" ADD COLUMN "produced_quantity" numeric DEFAULT '0' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "productions" ADD CONSTRAINT "productions_shipment_item_id_shipment_items_id_fk" FOREIGN KEY ("shipment_item_id") REFERENCES "public"."shipment_items"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "productions" ADD CONSTRAINT "productions_seamstress_id_seamstress_id_fk" FOREIGN KEY ("seamstress_id") REFERENCES "public"."seamstress"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
