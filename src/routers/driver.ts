import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { checkAuthed, type Env } from "@/middlewares";
import { db } from "@/db";
import { and, eq, gte, isNotNull, isNull, lte, or } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { usersToRoles } from "@/db/schemas/roles";
import { users } from "@/db/schemas/auth";
import { driverPosition, routes } from "@/db/schemas/routes";
import { startOfToday, endOfToday } from "date-fns";
import { determineStatus } from "@/helpers/determine-status";
import type { SelectShipment } from "@/schemas/shipments";
import { shipments } from "@/db/schemas/shipments";

const router = new Hono<Env>();

const factory = createFactory();

export const driverMiddleware = factory.createMiddleware(async (c, next) => {
  try {
    const error = await checkAuthed(c);

    if (error) return c.newResponse(null, 401);

    const userId = c.get("userId");

    const userRecord = await db.query.usersToRoles.findFirst({
      where: eq(usersToRoles.userId, userId),
    });

    if (!userRecord) throw new Error("NOT_FOUND");

    return await next();
  } catch (err: any) {
    if (err.message === "NOT_FOUND") {
      return c.notFound();
    }

    console.error("Driver middleware error:", err);
    return c.json({ error: "Internal Server Error" }, 500);
  }
});

router.use(driverMiddleware);

export const driverRouter = router
  .get("/", async (c) => {
    const driverId = c.get("userId");

    if (!driverId) return c.notFound();

    const driverRecord = await db.query.users.findFirst({
      where: eq(users.id, driverId),
      with: {
        profile: true,
      },
    });

    if (!driverRecord) {
      return c.notFound();
    }

    return c.json(driverRecord, 200);
  })
  .get("/assigned-routes", async (c) => {
    const driverId = c.get("userId") ?? "";

    if (!driverId) return c.notFound();

    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const routesRecord = await db.query.routes.findMany({
      where: and(
        eq(routes.driverId, driverId),
        or(
          isNull(routes.endTime),
          and(gte(routes.endTime, todayStart), lte(routes.endTime, todayEnd))
        )
      ),
      with: {
        shipment: {
          with: {
            items: true,
          },
        },
        location: true,
        recipient: {
          with: {
            businessInfo: true,
          },
        },
      },
    });

    const routesWithStatus = routesRecord.map((route) => {
      const shipment = route.shipment;

      const status = determineStatus(shipment as unknown as SelectShipment);

      return {
        ...route,
        shipment: {
          ...shipment,
          status,
        },
      };
    });

    return c.json(routesWithStatus, 200);
  })
  .post(
    "/start-route/:routeId",
    zValidator(
      "param",
      z.object({
        routeId: z.string().uuid(),
      })
    ),
    async (c) => {
      // Extract validated data
      const { routeId } = c.req.valid("param");

      const userId = c.get("userId") ?? "";

      if (!userId) return c.notFound();

      // Verify that the route exists and belongs to the authenticated driver
      const routeRecord = await db.query.routes.findFirst({
        where: and(
          eq(routes.id, routeId),
          eq(routes.driverId, userId),
          isNull(routes.startTime)
        ),
      });

      if (!routeRecord) {
        return c.notFound();
      }

      // Verify if user already has a route happening
      const startedRouteRecord = await db.query.routes.findFirst({
        where: and(
          eq(routes.driverId, userId),
          isNotNull(routes.startTime),
          isNull(routes.endTime)
        ),
      });

      if (startedRouteRecord) {
        return c.json(
          { message: "Já existe uma rota iniciada sendo atendida." },
          400
        );
      }

      const [updatedRouteRecord] = await db
        .update(routes)
        .set({
          startTime: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(routes.id, routeId))
        .returning();

      return c.json(updatedRouteRecord, 200);
    }
  )
  .post(
    "/end-route/:routeId",
    zValidator(
      "param",
      z.object({
        routeId: z.string().uuid(),
      })
    ),
    async (c) => {
      // Extract validated data
      const { routeId } = c.req.valid("param");

      const userId = c.get("userId") ?? "";

      if (!userId) return c.notFound();

      // Verify that the route exists and belongs to the authenticated driver
      const routeRecord = await db.query.routes.findFirst({
        where: and(
          eq(routes.id, routeId),
          eq(routes.driverId, userId),
          isNotNull(routes.startTime),
          isNull(routes.endTime)
        ),
      });

      if (!routeRecord) {
        return c.json(
          { message: "Você só pode finalizar uma rota sendo atendida." },
          400
        );
      }

      const updatedRoute = await db.transaction(async (tx) => {
        const [updatedRouteRecord] = await tx
          .update(routes)
          .set({
            endTime: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(routes.id, routeId))
          .returning()
          .execute();

        await tx
          .update(shipments)
          .set({
            deliveredAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(shipments.id, routeRecord.shipmentId))
          .execute();

        return updatedRouteRecord;
      });

      return c.json(updatedRoute, 200);
    }
  )
  .put(
    "/position",
    zValidator(
      "json",
      z.object({
        lat: z.string().or(z.number().transform(String)).optional(),
        lng: z.string().or(z.number().transform(String)).optional(),
      })
    ),
    async (c) => {
      const { lat, lng } = c.req.valid("json");

      const driverId = c.get("userId") ?? "";

      if (!driverId) return c.notFound();

      // Verify that the route exists and belongs to the authenticated driver
      const routeRecord = await db.query.driverPosition.findFirst({
        where: and(eq(driverPosition.driverId, driverId)),
      });

      if (!routeRecord) {
        await db
          .insert(driverPosition)
          .values({
            lat,
            lng,
            driverId,
            createdAt: new Date(),
          })
          .execute();

        return c.json({ success: true }, 200);
      } else {
        await db
          .update(driverPosition)
          .set({
            lat,
            lng,
            updatedAt: new Date(),
          })
          .where(eq(driverPosition.id, routeRecord.id))
          .execute();

        return c.json({ success: true }, 200);
      }
    }
  );
