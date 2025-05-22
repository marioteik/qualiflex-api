// clean no message chat rooms

import { db } from "@/db";
import { eq, isNull } from "drizzle-orm";
import { rooms } from "@/db/schemas/chat-rooms";
import { chatMessages } from "@/db/schemas/chat-messages";

export default async function cleanNoMessageChatRooms() {
  // get all chat rooms with no messages
  const cleanChatRooms = await db.query.rooms.findMany({
    with: {
      chatMessages: true,
    },
  });

  const roomsToDelete = cleanChatRooms.filter(
    (chatRoom) => chatRoom.chatMessages.length === 0
  );

  if (roomsToDelete.length > 0) {
    for (const chatRoom of roomsToDelete) {
      await db.delete(rooms).where(eq(rooms.id, chatRoom.id));
    }

    console.log(`Deletadas ${roomsToDelete.length} salas de chat vazias!`);
  } else {
    console.log("Nenhuma sala de chat vazia encontrada!");
  }
}
