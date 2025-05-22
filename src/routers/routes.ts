import { db } from "@/db";
import { routes } from "@/db/schemas/routes";
import { and, eq, getTableColumns, isNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { usersToRoles } from "@/db/schemas/roles";
import { users } from "@/db/schemas/auth";
import { zValidator } from "@hono/zod-validator";
import { insertRoutesSchema } from "@/schemas/routes";
import { profiles } from "@/db/schemas/profile";
import { locations } from "@/db/schemas/locations";
import { staffRoleMiddleware } from "@/middlewares";

const routesRouter = new Hono();

routesRouter.use(staffRoleMiddleware);

routesRouter
  .get("/", async (c) => {
    try {
      const driversWithRoutes = await db
        .select({
          // Build a user object in Drizzle,
          // or just store them as separate fields
          driver: {
            ...getTableColumns(users),
            name: profiles.fullName,
          },

          // This is the JSON-aggregated routes array:
          routes: sql<JSON>`
      COALESCE(
        json_agg(
          json_build_object(
            -- Route fields:
            'id', routes.id,
            'shipmentId', routes.shipment_id,
            'driverId', routes.driver_id,
            'recipientId', routes.recipient_id,
            'startTime', routes.start_time,
            'endTime', routes.end_time,
            'weight', routes.weight,
            -- Nested location object:
            'location', json_build_object(
              'id', locations.id,
              'lat', locations.lat,
              'lng', locations.lng,
              'formattedAddress', locations.formatted_address
            )
          )
        ) FILTER (WHERE routes.id IS NOT NULL),
        '[]'::json
      )
    `.as("routes"),
        })
        .from(users)
        .innerJoin(
          usersToRoles,
          and(eq(users.id, usersToRoles.userId), eq(usersToRoles.roleId, 4))
        )
        .leftJoin(profiles, eq(users.id, profiles.id))
        .leftJoin(
          routes,
          and(eq(routes.driverId, users.id), isNull(routes.endTime))
        )
        .leftJoin(locations, eq(routes.locationId, locations.id))
        .where(and(isNull(users.deletedAt), isNull(users.bannedUntil)))
        .groupBy(users.id, users.email, users.phone, profiles.fullName);

      return c.json(driversWithRoutes, 200);
    } catch (error) {
      console.error(error);
      return c.json({ message: "Error retrieving drivers", error }, 500);
    }
  })
  .put(
    "/",
    zValidator("json", insertRoutesSchema.or(insertRoutesSchema.array())),
    async (c) => {
      const routeData = c.req.valid("json");

      try {
        const upsertedRoutes = await db.transaction(async (tx) => {
          const routesArray = Array.isArray(routeData)
            ? routeData
            : [routeData];
          const results = [];

          for (const route of routesArray) {
            const existingRoute = await tx.query.routes.findFirst({
              where: and(
                isNull(routes.startTime),
                eq(routes.shipmentId, route.shipmentId)
              ),
            });

            if (existingRoute) {
              const [updated] = await tx
                .update(routes)
                .set({
                  ...route,
                  updatedAt: new Date(),
                })
                .where(eq(routes.id, existingRoute.id))
                .returning();

              results.push(updated);
            } else {
              const [inserted] = await tx
                .insert(routes)
                .values({
                  ...route,
                  createdAt: new Date(),
                })
                .returning();

              results.push(inserted);
            }
          }

          return results;
        });

        return c.json(upsertedRoutes, 200);
      } catch (error) {
        console.error("Error upserting route:", error);
        return c.json({ message: "Error upserting route", error }, 500);
      }
    }
  );

export { routesRouter };
