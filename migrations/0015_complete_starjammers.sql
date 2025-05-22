ALTER TABLE "locations" ALTER COLUMN "street_number" SET DEFAULT 'Sem número';--> statement-breakpoint
ALTER TABLE "locations" ALTER COLUMN "street_number" DROP NOT NULL;