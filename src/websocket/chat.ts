import { type Server } from "socket.io";
import { db } from "@/db";
import { seamstressToUsers } from "@/db/schemas/seamstress";
import { asc, desc, eq } from "drizzle-orm";
import { checkAuthed } from "./middlewares";
import { shipments } from "@/db/schemas/shipments";
import type { ChatMessage } from "@/db/schemas/chat";
import { chatMessages } from "@/db/schemas/chat-messages";
import { supabase } from "@/supabase/server";
import { keysToCamel } from "@/helpers/snake-to-camelcase";
import { rooms } from "@/db/schemas/chat-rooms";

export const canAccessShipment = async (
  seamstressId: string,
  shipmentId: string
): Promise<boolean> => {
  const shipment = await db.query.shipments.findFirst({
    where: eq(shipments.id, shipmentId),
  });

  // Return true if error
  return !shipment || shipment.recipientId !== seamstressId;
};

export const chatChannel = (io: Server) => {
  const realtimeChannel = supabase
    .channel("chat_messages")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages" },
      async (payload) => {
        const message = keysToCamel(payload.new);

        console.log("New chat message for shipment:", message.shipmentId);

        seamstressChatNamespace
          .to("chat-" + message.shipmentId)
          .emit("chat:message", message);
      }
    )
    .subscribe();

  /**
   * 1) SEAMSTRESS NAMESPACE
   */
  const seamstressChatNamespace = io.of(
    /^\/chat\/seamstress\/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/
  );
  seamstressChatNamespace.use(checkAuthed);

  seamstressChatNamespace.on("connection", async (socket) => {
    const seamstressRecord = await db.query.seamstressToUsers.findFirst({
      where: eq(seamstressToUsers.userId, socket.user!.userId),
      with: {
        seamstress: {
          with: {
            businessInfo: true,
          },
        },
      },
    });

    if (!seamstressRecord) {
      socket.disconnect();
      return;
    }

    console.log(
      "Seamstress connected for chat:",
      seamstressRecord.seamstressId
    );

    const shipmentId = `${socket.nsp.name}`.split("/").pop();

    socket.join("chat-" + shipmentId!);

    const contact =
      seamstressRecord.seamstress.businessInfo.contact?.trim() ||
      seamstressRecord.seamstress.businessInfo.tradeName?.trim() ||
      seamstressRecord.seamstress.businessInfo.nameCorporateReason.trim();

    // create a room if it doesn't exist
    await db
      .insert(rooms)
      .values({
        name: contact,
        shipmentId: shipmentId!,
        createdAt: new Date(),
      })
      .onConflictDoNothing();

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.shipmentId, shipmentId!),
      orderBy: desc(shipments.createdAt),
    });

    socket.nsp.to("chat-" + shipmentId!).emit("chat:messages", messages);

    socket.on("chat:message", async (msg: Omit<ChatMessage, "senderId">) => {
      const newMessage: ChatMessage = {
        ...msg,
        createdAt: new Date(),
        senderId: socket.user!.userId,
        senderName: contact,
      };

      try {
        await db.insert(chatMessages).values(newMessage);
      } catch (e) {
        throw (e as Error).message;
      }
    });

    socket.on("disconnect", () => {
      console.log("Seamstress chat disconnected: ", socket.user?.userId);
    });
  });
};
