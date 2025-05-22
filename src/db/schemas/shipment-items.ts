import { index, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { relations, sql, SQL } from "drizzle-orm";
import { timestamps } from "@/db/schemas/timestamps";
import { products } from "@/db/schemas/products";
import { shipments } from "@/db/schemas/shipments";

export const units = pgTable(
  "units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    unitName: text("unit_name").notNull(),
  },
  (table) => ({
    unitNameIdx: index("unit_name_idx").on(table.unitName),
  })
);

export const shipmentItems = pgTable(
  "shipment_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id),
    unitId: uuid("unit_id").references(() => units.id),
    quantity: numeric("quantity").notNull(),
    producedQuantity: numeric("produced_quantity").notNull().default("0"),
    unitPrice: numeric("unit_price").notNull(),
    totalPrice: numeric("total_price").generatedAlwaysAs(
      (): SQL => sql`${shipmentItems.quantity}
            *
            ${shipmentItems.unitPrice}`
    ),
    ...timestamps,
  },
  (table) => ({
    shipmentItemIdIndex: index("shipment_item_id_idx").on(table.shipmentId),
    shipmentItemIdProductIdIdx: index("shipment_item_product_id_idx").on(
      table.productId
    ),
  })
);

export const shipmentItemsRelations = relations(
  shipmentItems,
  ({ one, many }) => ({
    shipment: one(shipments, {
      fields: [shipmentItems.shipmentId],
      references: [shipments.id],
    }),
    product: one(products, {
      fields: [shipmentItems.productId],
      references: [products.id],
    }),
    unit: one(units, {
      fields: [shipmentItems.unitId],
      references: [units.id],
    }),
  })
);
