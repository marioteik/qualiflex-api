import { Hono } from "hono";
import { db } from "@/db";
import { and, eq, getTableColumns, isNotNull, isNull, sql } from "drizzle-orm";
import { staffRoleMiddleware } from "@/middlewares";
import { products } from "@/db/schemas/products";
import { shipmentItems } from "@/db/schemas/shipment-items";
import { shipments } from "@/db/schemas/shipments";
import {
  orders,
  shipmentItemToOrder,
  shipmentsToOrder,
} from "@/db/schemas/orders";

const productsRouter = new Hono();

productsRouter.use(staffRoleMiddleware);

productsRouter.get("/", async (c) => {
  try {
    const allProducts = await db
      .select({
        // all product columns
        ...getTableColumns(products),
        unitPrice: sql<number>`MAX(${shipmentItems.unitPrice})`.as("unitPrice"),
        // distinct counts
        inShipments: sql<number>`COUNT(DISTINCT ${shipments.id})`.as(
          "inShipments"
        ),
        inOrders: sql<number>`COUNT(DISTINCT ${orders.id})`.as("inOrders"),
      })
      .from(products)
      .leftJoin(shipmentItems, eq(shipmentItems.productId, products.id))
      .leftJoin(
        shipments,
        and(
          eq(shipmentItems.shipmentId, shipments.id),
          isNull(shipments.finishedAt),
          isNotNull(shipments.confirmedAt)
        )
      )

      // IMPORTANT: link shipmentItemToOrder by shipmentItemId => shipmentItems.id
      .leftJoin(
        shipmentItemToOrder,
        eq(shipmentItemToOrder.shipmentItemId, shipmentItems.id)
      )
      .leftJoin(shipmentsToOrder, eq(shipmentsToOrder.shipmentId, shipments.id))

      .leftJoin(
        orders,
        and(
          eq(shipmentItemToOrder.orderId, orders.id),
          eq(shipmentsToOrder.orderId, orders.id)
        )
      )

      .where(isNull(products.deletedAt))
      .groupBy(products.id);

    return c.json(allProducts, 200);
  } catch (error) {
    return c.json({ message: "Error retrieving products", error }, 500);
  }
});

export { productsRouter };
