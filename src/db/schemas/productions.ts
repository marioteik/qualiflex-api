import { pgTable, uuid, numeric, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { shipmentItems } from "@/db/schemas/shipment-items";
import { seamstress } from "@/db/schemas/seamstress";
import { timestamps } from "@/db/schemas/timestamps";

export const productions = pgTable("productions", {
  id: uuid("id").primaryKey().defaultRandom(),
  shipmentItemId: uuid("shipment_item_id")
    .notNull()
    .references(() => shipmentItems.id),
  producedQuantity: numeric("produced_quantity").notNull(),
  seamstressId: uuid("seamstress_id")
    .notNull()
    .references(() => seamstress.id),
  ...timestamps,
});

export const productionsRelations = relations(productions, ({ one }) => ({
  shipmentItem: one(shipmentItems, {
    fields: [productions.shipmentItemId],
    references: [shipmentItems.id],
  }),
  seamstress: one(seamstress, {
    fields: [productions.seamstressId],
    references: [seamstress.id],
  }),
}));
