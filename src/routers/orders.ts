import { Hono } from "hono";
import { db } from "@/db";
import { staffRoleMiddleware } from "@/middlewares";
import { orders, shipmentsToOrder } from "@/db/schemas/orders";
import { shipments } from "@/db/schemas/shipments";

const ordersRouter = new Hono();

ordersRouter.use(staffRoleMiddleware);

ordersRouter.get("/", async (c) => {
  try {
    const ordersRecords = await db.query.orders.findMany({
      where: (orders, { exists, and, eq, isNotNull, isNull }) => {
        return exists(
          db
            .select()
            .from(shipmentsToOrder)
            .innerJoin(shipments, eq(shipmentsToOrder.shipmentId, shipments.id))
            .where(
              and(
                eq(shipmentsToOrder.orderId, orders.id),
                isNotNull(shipments.confirmedAt),
                isNull(shipments.deletedAt),
                isNull(shipments.finishedAt)
              )
            )
        );
      },
      with: {
        shipments: {
          with: {
            shipment: true,
          },
        },
        shipmentItems: {
          with: {
            shipmentItem: true,
          },
        },
      },
    });

    return c.json(ordersRecords, 200);
  } catch (error) {
    console.error("Database error:", error);
    return c.json(
      {
        message: "Error retrieving orders",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

export { ordersRouter };
