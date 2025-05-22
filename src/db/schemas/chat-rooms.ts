import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "@/db/schemas/timestamps";
import { chatMessages } from "@/db/schemas/chat-messages";
import { shipments } from "@/db/schemas/shipments";

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  shipmentId: uuid("shipment_id")
    .notNull()
    .unique()
    .references(() => shipments.id),
  ...timestamps,
});

export const roomsRelations = relations(rooms, ({ many, one }) => ({
  chatMessages: many(chatMessages),
  shipment: one(shipments, {
    fields: [rooms.shipmentId],
    references: [shipments.id],
  }),
}));
