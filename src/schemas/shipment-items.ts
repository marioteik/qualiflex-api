import { timestamps } from "./timestamps";
import { z } from "zod";
import { selectProductSchema } from "./products";

const insertShipmentItemSchema = timestamps.merge(
  z.object({
    id: z.string().uuid(),
    shipmentId: z.string().uuid(),
    productId: z.string().uuid(),
    unitId: z.string().uuid().nullable(),
    quantity: z.number(),
    unitPrice: z.number(),
    totalPrice: z.number().optional(),
  }),
);

const selectShipmentItemSchema = insertShipmentItemSchema.merge(
  z.object({
    id: z.string().uuid(),
    product: selectProductSchema.optional(),
  }),
);

type InsertShipmentItem = z.infer<typeof insertShipmentItemSchema>;
type SelectShipmentItem = z.infer<typeof selectShipmentItemSchema>;

export {
  insertShipmentItemSchema,
  selectShipmentItemSchema,
  type InsertShipmentItem,
  type SelectShipmentItem,
};
