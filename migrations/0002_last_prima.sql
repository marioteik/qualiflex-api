CREATE TABLE IF NOT EXISTS "seamstress_to_users" (
	"seamstress_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "seamstress_to_users_seamstress_id_user_id_pk" PRIMARY KEY("seamstress_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "confirmed_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "delivered_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "finished_at" timestamp;--> statement-breakpoint
ALTER TABLE "shipments" ADD COLUMN "collected_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seamstress_to_users" ADD CONSTRAINT "seamstress_to_users_seamstress_id_seamstress_id_fk" FOREIGN KEY ("seamstress_id") REFERENCES "public"."seamstress"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "seamstress_to_users" ADD CONSTRAINT "seamstress_to_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
