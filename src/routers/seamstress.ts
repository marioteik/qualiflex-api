import { Hono } from "hono";
import { db } from "@/db";
import { and, isNull } from "drizzle-orm";
import { staffRoleMiddleware } from "@/middlewares";
import { seamstress } from "@/db/schemas/seamstress";

const seamstressRouter = new Hono();

seamstressRouter.use(staffRoleMiddleware);

seamstressRouter.get("/", async (c) => {
  try {
    const seamstressRecords = await db.query.seamstress.findMany({
      where: and(isNull(seamstress.deletedAt)),
      with: {
        businessInfo: true,
        location: true,
      },
    });

    return c.json(seamstressRecords, 200);
  } catch (error) {
    console.log(error);
    return c.json({ message: "Error retrieving seamstress", error }, 500);
  }
});

export { seamstressRouter };
