import { z } from "zod";
import { timestamps } from "./timestamps";
import { selectShipmentSchema } from "./shipments";
import { chatMessageSchema } from "./chat";

export const insertRoomSchema = z.object({
  shipmentId: z.string(),
});

export const roomSchema = timestamps.extend({
  id: z.string().optional(),
  shipmentId: z.string(),
  name: z.string(),
  shipment: selectShipmentSchema,
  chatMessages: chatMessageSchema.array(),
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = z.infer<typeof roomSchema>;
