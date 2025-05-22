import { Hono } from "hono";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { type Env, staffRoleMiddleware } from "@/middlewares";
import { chatMessages } from "@/db/schemas/chat-messages";
import { zValidator } from "@hono/zod-validator";
import { insertRoomSchema } from "@/schemas/room";
import { rooms } from "@/db/schemas/chat-rooms";
import { shipments } from "@/db/schemas/shipments";
import { z } from "zod";
import { type ChatMessage, chatMessageSchema } from "@/schemas/chat";

const router = new Hono<Env>();

router.use(staffRoleMiddleware);

export const chatRoomsRouter = router
  .get("/", async (c) => {
    const chatRooms = await db.query.rooms.findMany({
      orderBy: desc(chatMessages.createdAt),
      with: {
        chatMessages: {
          orderBy: asc(chatMessages.createdAt),
        },
        shipment: {
          with: {
            recipient: {
              with: {
                businessInfo: true,
                location: true,
                user: true,
              },
            },
            items: {
              with: {
                product: true,
              },
            },
            financialCalc: true,
          },
        },
      },
    });

    return c.json(chatRooms);
  })
  .post("/", zValidator("json", insertRoomSchema), async (c) => {
    const validated = c.req.valid("json");

    const room = await db.query.rooms.findFirst({
      where: eq(rooms.shipmentId, validated.shipmentId),
    });

    if (room) {
      return c.json(room, 409);
    }

    const shipment = await db.query.shipments.findFirst({
      where: eq(shipments.id, validated.shipmentId),
      with: {
        recipient: {
          with: {
            businessInfo: true,
            location: true,
          },
        },
      },
    });

    if (!shipment) {
      return c.json(room, 404);
    }

    const contact =
      shipment.recipient.businessInfo.contact?.trim() ||
      shipment.recipient.businessInfo.tradeName?.trim() ||
      shipment.recipient.businessInfo.nameCorporateReason.trim();

    const newRoom = {
      ...validated,
      createdAt: new Date(),
      name: contact,
    };

    const [roomRecord] = await db.insert(rooms).values(newRoom).returning();

    return c.json(roomRecord, 201);
  })
  .post(
    "/:shipmentId",
    zValidator("json", chatMessageSchema),
    zValidator(
      "param",
      z.object({
        shipmentId: z.string().uuid(),
      })
    ),
    async (c) => {
      const chatMessage = c.req.valid("json");
      const { shipmentId } = c.req.valid("param");
      const userId = c.get("userId");

      const room = await db.query.rooms.findFirst({
        where: eq(rooms.shipmentId, shipmentId),
      });

      if (!room) {
        return c.json(
          {
            message: "Room not found",
          },
          404
        );
      }

      const newMessage: ChatMessage = {
        ...chatMessage,
        createdAt: new Date(),
        senderId: userId!,
        shipmentId,
      };

      const [chatMessageRecord] = await db
        .insert(chatMessages)
        .values(newMessage)
        .returning();

      return c.json(chatMessageRecord, 201);
    }
  );
// .put("/", zValidator("json", selectRoleSchema), async (c) => {
//   const validated = c.req.valid("json");
//
//   const [role] = await db
//     .update(roles)
//     .set(validated)
//     .where(eq(roles.id, validated.id))
//     .returning();
//
//   return c.json(role, 202);
// });
// .delete(
//   "/:id",
//   validator("param", async (value, c) => {
//     const result = await z
//       .number()
//       .or(z.string().transform(Number))
//       .safeParseAsync(value.id);
//
//     if (!result.success) {
//       return c.json(result, 400);
//     }
//
//     return result.data;
//   }),
//   async (c) => {
//     const id = c.req.valid("param");
//
//     await db.delete(roles).where(eq(roles.id, id));
//
//     return c.json({ ok: true }, 200);
//   },
// );
