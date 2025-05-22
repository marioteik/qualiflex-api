import { Hono } from "hono";
import { db } from "@/db";
import { and, eq, isNotNull, isNull, or } from "drizzle-orm";
import { shipments } from "@/db/schemas/shipments";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import * as pdfjsLib from "pdfjs-dist";
import { type SelectShipment, selectShipmentSchema } from "@/schemas/shipments";
import { differenceInDays, parseISO } from "date-fns";
import { adminRoleMiddleware, staffRoleMiddleware } from "@/middlewares";
import { determineStatus } from "@/helpers/determine-status";

const shipmentRouter = new Hono();

shipmentRouter.use(staffRoleMiddleware);

shipmentRouter
  .get("/", async (c) => {
    try {
      const allShipments = await db.query.shipments.findMany({
        where: and(isNull(shipments.deletedAt), isNull(shipments.archivedAt)),
        with: {
          recipient: {
            with: {
              businessInfo: true,
              location: true,
            },
          },
          financialCalc: true,
          items: {
            with: {
              product: true,
            },
          },
        },
      });

      return c.json(
        allShipments.map((shipment) => {
          const offsetDays = differenceInDays(
            shipment.informedEstimation!,
            shipment.systemEstimation!
          );

          const status = determineStatus(shipment as unknown as SelectShipment);

          return {
            ...shipment,
            status,
            offsetDays: status === "Pendente" ? 0 : offsetDays,
          };
        }),
        200
      );
    } catch (error) {
      return c.json({ message: "Error retrieving shipments", error }, 500);
    }
  })
  .put(
    "/",
    zValidator(
      "json",
      z.union([
        selectShipmentSchema.partial(),
        z.array(selectShipmentSchema.partial()),
      ])
    ),
    async (c) => {
      try {
        const payload = c.req.valid("json");

        const results = await db.transaction(async (trx) => {
          if (Array.isArray(payload)) {
            // Group updates into a single batch
            const updates = payload.map((shipment) => {
              const { id, updateData } = prepareUpdateData(shipment);
              return trx
                .update(shipments)
                .set(updateData)
                .where(eq(shipments.id, id))
                .returning();
            });

            return (await Promise.all(updates)).flat();
          } else {
            const { id, updateData } = prepareUpdateData(payload);

            return trx
              .update(shipments)
              .set(updateData)
              .where(eq(shipments.id, id))
              .returning();
          }
        });

        if (results.length === 0) {
          return c.json({ message: "No shipments updated" }, 404);
        }

        return c.json(results, 200);
      } catch (error) {
        console.error(error);

        return c.json(
          {
            message: "Error updating shipments",
            error: (error as Error).message,
          },
          500
        );
      }
    }
  )
  .post(
    "/upload",
    zValidator(
      "form",
      z.object({
        file: z.instanceof(File),
      })
    ),
    async (c) => {
      try {
        const { file } = c.req.valid("form");

        if (!file) {
          return c.json({ error: "File not provided" }, 400);
        }

        if (file.type !== "application/pdf") {
          return c.json({ error: "File should be a PDF" }, 400);
        }

        // Read the uploaded file as a buffer and encode it to Base64
        const fileBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(fileBuffer);
        const pdfDocument = await loadingTask.promise;

        let fullText = "";

        // Iterate through each page
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
          const page = await pdfDocument.getPage(pageNum);
          const content = await page.getTextContent();

          // Extract text items from the page's content
          const strings = content.items.map((item: any) => item.str);
          const pageText = strings.join(" ");

          fullText += pageText + "\n";
        }

        const decodeText = fullText.split("   ").join("|").split("  ");

        // const danfe = parseDanfe(decodeText);

        return c.json({}, 200);
      } catch (err) {
        console.error(err);
        return c.json({ error: "Error processing file" }, 500);
      }
    }
  )
  .get("/archive", async (c) => {
    try {
      const allShipments = await db.query.shipments.findMany({
        where: isNotNull(shipments.confirmedAt),
        with: {
          recipient: {
            with: {
              businessInfo: true,
              location: true,
            },
          },
          financialCalc: true,
          items: {
            with: {
              product: true,
            },
          },
        },
      });

      return c.json(
        allShipments.map((shipment) => {
          const offsetDays = differenceInDays(
            shipment.informedEstimation!,
            shipment.systemEstimation!
          );

          const status = determineStatus(shipment as unknown as SelectShipment);

          return {
            ...shipment,
            status,
            offsetDays,
          };
        }),
        200
      );
    } catch (error) {
      return c.json({ message: "Error retrieving shipments", error }, 500);
    }
  })
  .delete("/:id", async (c) => {
    const id = c.req.param("id");
    try {
      const deletedShipment = await db
        .update(shipments)
        .set({ deletedAt: new Date() })
        .where(eq(shipments.id, id))
        .returning();

      if (deletedShipment.length === 0) {
        return c.json({ message: "Shipment not found" }, 404);
      } else {
        return c.json(
          {
            message: "Shipment soft deleted",
            deletedShipment: deletedShipment[0],
          },
          200
        );
      }
    } catch (error) {
      return c.json({ message: "Error deleting shipment", error }, 500);
    }
  });

const prepareUpdateData = (
  shipment: any
): { id: string; updateData: SelectShipment } => {
  const { id, status, ...rest } = shipment;

  if (!id) {
    throw new Error("Shipment ID is required");
  }

  const now = new Date();

  // Begin with a clean slate for timestamps
  const updateData: SelectShipment = {
    ...rest,
    updatedAt: now,
  };

  // Apply the appropriate timestamp based on status
  if (status) {
    switch (status) {
      case "Recusado":
        updateData.refusedAt = now;
        break;
      case "Coletado":
        updateData.collectedAt = now;
        updateData.refusedAt = null;
        break;
      case "Finalizado":
        updateData.finishedAt = now;
        updateData.collectedAt = null;
        updateData.refusedAt = null;
        break;
      case "Produzindo":
        updateData.deliveredAt = now;
        updateData.finishedAt = null;
        updateData.collectedAt = null;
        updateData.refusedAt = null;
        break;
      case "Confirmado":
        updateData.confirmedAt = now;
        updateData.deliveredAt = null;
        updateData.finishedAt = null;
        updateData.collectedAt = null;
        updateData.refusedAt = null;
        break;
      case "Pendente":
        updateData.confirmedAt = null;
        updateData.deliveredAt = null;
        updateData.finishedAt = null;
        updateData.collectedAt = null;
        updateData.refusedAt = null;
        break;
      default:
        break;
    }
  }

  return { id, updateData };
};

export { shipmentRouter };
