// /schemas/zodSchemas/orderSchema.ts
import { z } from "zod";
import { timestamps } from "./timestamps";
import { selectShipmentSchema } from "./shipments";
import { selectProductSchema } from "./products";

const insertOrderSchema = z
  .object({
    codeReference: z
      .string()
      .min(1, "Code reference is required and cannot be empty"),
  })
  .merge(timestamps);

const selectOrderSchema = z
  .object({
    id: z.string().uuid(),
    shipments: z
      .object({
        orderId: z.string().uuid(),
        shipment: selectShipmentSchema,
        shipmentId: z.string().uuid(),
      })
      .merge(timestamps)
      .array(),
    shipmentItems: z
      .object({
        orderId: z.string().uuid(),
        shipmentItem: selectProductSchema,
        shipmentId: z.string().uuid(),
      })
      .merge(timestamps)
      .array(),
  })
  .merge(insertOrderSchema);

type InsertOrder = z.infer<typeof insertOrderSchema>;
type SelectOrder = z.infer<typeof selectOrderSchema>;

export {
  insertOrderSchema,
  selectOrderSchema,
  type InsertOrder,
  type SelectOrder,
};
