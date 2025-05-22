import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schemas/timestamps";

export const shipmentImports = pgTable("shipment_imports", {
  id: uuid("id").primaryKey().defaultRandom(),
  shipments: varchar("shipments", { length: 15 }).array(),
  ...timestamps,
});
