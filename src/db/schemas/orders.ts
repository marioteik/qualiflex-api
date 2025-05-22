import { index, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schemas/timestamps";
import { shipments } from "@/db/schemas/shipments";
import { shipmentItems } from "@/db/schemas/shipment-items";
import { relations } from "drizzle-orm";
import { profiles } from "@/db/schemas/profile";
import { users } from "@/db/schemas/auth";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  codeReference: text("code_reference").notNull().unique(),
  ...timestamps,
});

export const orderRelations = relations(orders, ({ many }) => ({
  shipments: many(shipmentsToOrder),
  shipmentItems: many(shipmentItemToOrder),
}));

export const shipmentsToOrder = pgTable(
  "shipments_to_orders",
  {
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.shipmentId, table.orderId] }),
      shipmentsToOrderShipmentIdIdx: index(
        "shipments_to_order_shipment_id_idx"
      ).on(table.shipmentId),
      shipmentsToOrderOrderIdIdx: index("shipments_to_order_order_id_idx").on(
        table.orderId
      ),
    };
  }
);

export const shipmentsToOrderRelations = relations(
  shipmentsToOrder,
  ({ one }) => ({
    order: one(orders, {
      fields: [shipmentsToOrder.orderId],
      references: [orders.id],
    }),
    shipment: one(shipments, {
      fields: [shipmentsToOrder.shipmentId],
      references: [shipments.id],
    }),
  })
);

export const shipmentItemToOrder = pgTable(
  "shipment_items_to_orders",
  {
    shipmentItemId: uuid("shipment_item_id")
      .notNull()
      .references(() => shipmentItems.id, { onDelete: "cascade" }),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.shipmentItemId, table.orderId] }),
      shipmentItemToOrderShipmentItemIdIdx: index(
        "shipment_item_to_order_shipment_item_id_idx"
      ).on(table.shipmentItemId),
      shipmentItemToOrderOrderIdIdx: index(
        "shipment_item_to_order_order_id_idx"
      ).on(table.orderId),
    };
  }
);

export const shipmentItemToOrderRelations = relations(
  shipmentItemToOrder,
  ({ one }) => ({
    order: one(orders, {
      fields: [shipmentItemToOrder.orderId],
      references: [orders.id],
    }),
    shipmentItem: one(shipmentItems, {
      fields: [shipmentItemToOrder.shipmentItemId],
      references: [shipmentItems.id],
    }),
  })
);
