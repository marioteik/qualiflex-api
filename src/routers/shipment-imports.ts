import { Hono } from "hono";
import { db } from "@/db";
import { shipmentImports } from "@/db/schemas/shipment-imports";
import { adminRoleMiddleware } from "@/middlewares";
import { desc } from "drizzle-orm";

const shipmentImportsRouter = new Hono();

// Only admin users can access this router
shipmentImportsRouter.use(adminRoleMiddleware);

shipmentImportsRouter.get("/", async (c) => {
  try {
    const allShipmentImports = await db.query.shipmentImports.findMany({
      orderBy: desc(shipmentImports.createdAt),
    });

    return c.json(allShipmentImports, 200);
  } catch (error) {
    console.error("Error fetching shipment imports:", error);
    return c.json({ message: "Error retrieving shipment imports", error }, 500);
  }
});

export default shipmentImportsRouter;
