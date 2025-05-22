import {
  index,
  numeric,
  pgTable,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schemas/timestamps";
import { relations } from "drizzle-orm";
import { usersToRoles } from "@/db/schemas/roles";
import { shipmentItems } from "@/db/schemas/shipment-items";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar({ length: 50 }).notNull(),
    description: varchar({ length: 255 }).notNull(),
    price: numeric("price"),
    category: varchar({ length: 100 }),
    ...timestamps,
  },
  (table) => ({
    codeIndex: index("code_idx").on(table.code),
    codeUnique: unique("code_unique").on(table.code),
  })
);

export const productsRelations = relations(products, ({ many }) => ({
  shipmentItems: many(shipmentItems),
}));
