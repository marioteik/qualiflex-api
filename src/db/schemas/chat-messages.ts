import {
  index,
  pgTable,
  serial,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schemas/timestamps";
import { shipments } from "@/db/schemas/shipments";
import { users } from "@/db/schemas/auth";
import { relations } from "drizzle-orm";
import { rooms } from "@/db/schemas/chat-rooms";

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    message: text("message").notNull(),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    senderName: varchar("sender_name", { length: 255 }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => ({
    indexes: {
      chatMessagesShipmentIdx: index("chat_messages_shipment_idx").on(
        table.shipmentId
      ),
      chatMessagesSenderIdIdx: index("chat_messages_sender_idx").on(
        table.shipmentId
      ),
    },
  })
);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  room: one(rooms, {
    fields: [chatMessages.shipmentId],
    references: [rooms.shipmentId],
  }),
  shipment: one(shipments, {
    fields: [chatMessages.shipmentId],
    references: [shipments.id],
  }),
}));
