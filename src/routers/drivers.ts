import { db } from "@/db";
import { Hono } from "hono";
import { staffRoleMiddleware } from "@/middlewares";

const driversRoutes = new Hono();

driversRoutes.use(staffRoleMiddleware);

driversRoutes.get("/", async (c) => {
  try {
    return c.json(await db.query.driverPosition.findMany(), 200);
  } catch (error) {
    console.error(error);
    return c.json({ message: "Error retrieving drivers", error }, 500);
  }
});

export { driversRoutes };
