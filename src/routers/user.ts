import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { checkAuthed, type Env } from "@/middlewares";
import { db } from "@/db";
import { and, desc, eq, isNotNull, isNull, or } from "drizzle-orm";
import { businessInfos } from "@/db/schemas/business-info";
import { seamstress, seamstressToUsers } from "@/db/schemas/seamstress";
import { shipments } from "@/db/schemas/shipments";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { determineStatus } from "@/helpers/determine-status";
import {
  confirmShipment,
  refuseShipment,
  type SelectShipment,
} from "@/schemas/shipments";
import { profiles } from "@/db/schemas/profile";
import { shipmentItems } from "@/db/schemas/shipment-items";
import { productions } from "@/db/schemas/productions";

const router = new Hono<Env>();

const factory = createFactory();

export const seamstressMiddleware = factory.createMiddleware(
  async (c, next) => {
    const error = await checkAuthed(c);

    if (error) return c.newResponse(null, 401);

    try {
      const userId = c.get("userId");
      const phone = c.get("phone");

      await db.transaction(async (tx) => {
        const userToSeamstress = await tx.query.seamstressToUsers.findFirst({
          where: eq(seamstressToUsers.userId, userId),
        });

        if (userToSeamstress) {
          c.set("seamstressId", userToSeamstress.seamstressId);
          return;
        }

        const businessInfo = await tx.query.businessInfos.findFirst({
          columns: {
            nameCorporateReason: true,
            contact: true,
            tradeName: true,
          },
          with: {
            seamstress: {
              columns: { id: true },
            },
          },
          where: eq(businessInfos.phoneFax, phone),
        });

        if (!businessInfo?.seamstress.id) {
          throw new Error("NOT_FOUND");
        }

        await tx
          .insert(seamstressToUsers)
          .values({
            userId,
            seamstressId: businessInfo.seamstress.id,
          })
          .onConflictDoNothing();

        const name =
          businessInfo.tradeName ??
          businessInfo.nameCorporateReason ??
          businessInfo.contact;

        await tx
          .insert(profiles)
          .values({
            id: userId,
            fullName: name,
          })
          .onConflictDoUpdate({
            target: profiles.id,
            set: { fullName: name },
          })
          .execute();

        c.set("seamstressId", businessInfo.seamstress.id);
      });

      return await next();
    } catch (err: any) {
      if (err.message === "NOT_FOUND") {
        return c.notFound();
      }

      console.error("Seamstress middleware error:", err);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }
);

router.use(seamstressMiddleware);

export const userRouter = router
  .get("/", async (c) => {
    const seamstressId = c.get("seamstressId");

    if (!seamstressId) {
      return c.notFound();
    }

    const seamstressRecord = await db.query.seamstress.findFirst({
      where: eq(seamstress.id, seamstressId),
      with: {
        location: true,
        businessInfo: true,
      },
    });

    if (!seamstressRecord) {
      return c.notFound();
    }

    return c.json(seamstressRecord, 200);
  })
  .get("/active-shipments", async (c) => {
    const seamstressId = c.get("seamstressId") ?? "";

    const shipmentRecords = await db.query.shipments.findMany({
      where: and(
        eq(shipments.recipientId, seamstressId),
        and(
          or(
            isNull(shipments.confirmedAt),
            isNull(shipments.deliveredAt),
            isNull(shipments.finishedAt),
            isNull(shipments.collectedAt)
          ),
          isNull(shipments.refusedAt)
        )
      ),
      with: {
        items: {
          with: {
            product: true,
          },
        },
        financialCalc: true,
        recipient: true,
      },
    });

    return c.json(
      shipmentRecords.map((shipment) => {
        const status = determineStatus(shipment as unknown as SelectShipment);

        return {
          ...shipment,
          status,
        };
      }),
      200
    );
  })
  .get("/collected-shipments", async (c) => {
    const seamstressId = c.get("seamstressId") ?? "";
    const limit = c.req.query("limit");

    const shipmentRecords = await db.query.shipments.findMany({
      where: and(
        eq(shipments.recipientId, seamstressId),
        isNotNull(shipments.collectedAt)
      ),
      with: {
        items: true,
        financialCalc: true,
        recipient: true,
      },
      limit: limit ? Number(limit) : undefined,
      orderBy: desc(shipments.collectedAt),
    });

    return c.json(shipmentRecords, 200);
  })
  .post("/confirm-shipment", zValidator("json", confirmShipment), async (c) => {
    // Extract validated data
    const { shipmentId, informedEstimation } = c.req.valid("json");

    const seamstressId = c.get("seamstressId") ?? "";

    // Verify that the shipment exists and belongs to the authenticated seamstress
    const shipment = await db.query.shipments.findFirst({
      where: and(
        eq(shipments.id, shipmentId),
        eq(shipments.recipientId, seamstressId)
      ),
    });

    if (!shipment) {
      return c.notFound();
    }

    if (shipment.confirmedAt) {
      return c.json({ message: "Remessa já confirmada!" }, 400);
    }

    const [updatedShipment] = await db
      .update(shipments)
      .set({
        confirmedAt: new Date(),
        informedEstimation,
        systemEstimation: informedEstimation,
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, shipmentId))
      .returning();

    return c.json(updatedShipment, 200);
  })
  .post("/refuse-shipment", zValidator("json", refuseShipment), async (c) => {
    // Extract validated data
    const { shipmentId } = c.req.valid("json");

    const seamstressId = c.get("seamstressId") ?? "";

    // Verify that the shipment exists and belongs to the authenticated seamstress
    const shipment = await db.query.shipments.findFirst({
      where: and(
        eq(shipments.id, shipmentId),
        eq(shipments.recipientId, seamstressId)
      ),
    });

    if (!shipment) {
      return c.notFound();
    }

    if (shipment.refusedAt) {
      return c.json({ message: "Remessa já recusada!" }, 400);
    }

    const [updatedShipment] = await db
      .update(shipments)
      .set({
        refusedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(shipments.id, shipmentId))
      .returning();

    return c.json(updatedShipment, 200);
  })
  .post(
    "/update-production",
    zValidator(
      "json",
      z.array(
        z.object({
          shipmentItemId: z.string().uuid(),
          producedQuantity: z.number().min(0),
        })
      )
    ),
    async (c) => {
      const seamstressId = c.get("seamstressId");
      const data = c.req.valid("json");

      try {
        await db.transaction(async (tx) => {
          for (const item of data) {
            const shipmentItem = await tx.query.shipmentItems.findFirst({
              where: (si, { eq }) => eq(si.id, item.shipmentItemId),
              with: {
                shipment: {
                  columns: { recipientId: true },
                },
              },
            });

            if (
              !shipmentItem ||
              shipmentItem.shipment.recipientId !== seamstressId
            ) {
              throw new Error("Invalid shipment item");
            }

            const currentProduced = Number(shipmentItem.producedQuantity);
            const maxQuantity = Number(shipmentItem.quantity);

            if (
              item.producedQuantity < currentProduced ||
              item.producedQuantity > maxQuantity
            ) {
              throw new Error(
                `Invalid quantity for item ${item.shipmentItemId}. Must be between ${currentProduced} and ${maxQuantity}`
              );
            }

            await tx
              .update(shipmentItems)
              .set({ producedQuantity: item.producedQuantity.toString() })
              .where(eq(shipmentItems.id, item.shipmentItemId));

            await tx.insert(productions).values({
              shipmentItemId: item.shipmentItemId,
              producedQuantity: item.producedQuantity.toString(),
              seamstressId,
            });
          }
        });

        return c.json({ success: true });
      } catch (error: any) {
        console.error("Production update error:", error);
        return c.json({ error: error.message }, 400);
      }
    }
  );
