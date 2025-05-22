import { z } from "zod";
import { timestamps } from "./timestamps";

export const chatMessageSchema = timestamps.extend({
  id: z.string().optional(),
  shipmentId: z.string(),
  message: z.string().min(1),
  senderId: z.string(),
  senderName: z.string().nullable().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
