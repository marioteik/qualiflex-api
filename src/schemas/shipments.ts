import { z } from "zod";
import { insertSeamstressSchema, selectSeamstressSchema } from "./seamstress";
import {
  insertFinancialCalculationSchema,
  selectFinancialCalculationSchema,
} from "./financial-calcs";
import { insertProductSchema } from "./products";
import { selectShipmentItemSchema } from "./shipment-items";
import { timestamps } from "./timestamps";
import { dateParser } from "./utils";

const insertShipmentSchema = timestamps.extend({
  number: z.string().min(1, "Number is required and cannot be empty"),
  accessKey: z.optional(
    z.string().min(1, "Access key is required and cannot be empty").nullable(),
  ),
  series: z.string().min(1, "Series is required and cannot be empty"),
  type: z.string().min(1, "Type is required and cannot be empty"),
  authorizationProtocol: z.optional(
    z
      .string()
      .min(1, "Authorization protocol is required and cannot be empty")
      .nullable(),
  ),
  issueDate: dateParser.nullable(),
  entryExitDate: dateParser.nullable(),
  entryExitTime: z.string().nullable().optional(),
  status: z.string().optional(),
  transportationType: z.string().default("1"),
  recipient: insertSeamstressSchema,
  financialCalc: insertFinancialCalculationSchema,
  products: insertProductSchema.array().optional(),
});

const selectShipmentSchema = insertShipmentSchema.merge(
  z.object({
    id: z.string().uuid(),
    recipient: selectSeamstressSchema,
    financialCalc: selectFinancialCalculationSchema,
    items: selectShipmentItemSchema.array(),
    confirmedAt: dateParser.nullable().optional(),
    deliveredAt: dateParser.nullable().optional(),
    refusedAt: dateParser.nullable().optional(),
    finishedAt: dateParser.nullable().optional(),
    collectedAt: dateParser.nullable().optional(),
    status: z
      .enum([
        "Recusado",
        "Coletado",
        "Finalizado",
        "Produzindo",
        "Confirmado",
        "Pendente",
      ])
      .optional(),
    systemEstimation: dateParser.nullable().optional(),
    informedEstimation: dateParser.nullable().optional(),
    offsetDays: z.number().optional(),
  }),
);

const confirmShipment = z.object({
  shipmentId: z.string().uuid(),
  informedEstimation: dateParser,
});

const refuseShipment = z.object({
  shipmentId: z.string().uuid(),
});

export const productionsSchema = z.object({
  shipmentItemId: z.string().uuid(),
  producedQuantity: z.number().min(0),
});

type InsertShipment = z.infer<typeof insertShipmentSchema>;
type SelectShipment = z.infer<typeof selectShipmentSchema>;
type ConfirmShipment = z.infer<typeof confirmShipment>;
type RefuseShipment = z.infer<typeof refuseShipment>;
type Production = z.infer<typeof productionsSchema>;

export {
  insertShipmentSchema,
  selectShipmentSchema,
  confirmShipment,
  refuseShipment,
  type InsertShipment,
  type SelectShipment,
  type ConfirmShipment,
  type RefuseShipment,
  type Production,
};
