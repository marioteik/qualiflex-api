import { timestamps } from "./timestamps";
import { z } from "zod";
import { dateParser } from "./utils";
import { baseUser } from "./auth";
import { selectLocationSchema } from "./locations";
import { selectShipmentSchema } from "./shipments";
import { selectSeamstressSchema } from "./seamstress";

export const insertRoutesSchema = z.object({
  locationId: z.string().uuid(),
  driverId: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .transform((val) => (!val ? null : val)),
  shipmentId: z.string().uuid(),
  recipientId: z.string().uuid(),
  startTime: dateParser.nullable().optional(),
  endTime: dateParser.nullable().optional(),
  weight: z.number().int().optional(),
});

export const selectRoutesSchema = insertRoutesSchema
  .extend({
    id: z.string().uuid(),
    driver: baseUser.optional(),
    location: selectLocationSchema.optional(),
    shipment: selectShipmentSchema.optional(),
    recipient: selectSeamstressSchema.optional(),
  })
  .merge(timestamps);

export const driverSchema = z.object({
  routes: selectRoutesSchema.array(),
  driver: baseUser.optional(),
});

export const insertDriverPositionSchema = z.object({
  lat: z.string().or(z.number().transform(String)).optional(),
  lng: z.string().or(z.number().transform(String)).optional(),
});

export const selectDriverPositionSchema = insertDriverPositionSchema
  .merge(
    z.object({
      id: z.string().uuid(),
      driverId: z.string().uuid(),
    }),
  )
  .merge(timestamps);

export const driverList = driverSchema.array();
export const updateDriverList = driverSchema.array();

export type InsertRoute = z.infer<typeof insertRoutesSchema>;
export type SelectRoute = z.infer<typeof selectRoutesSchema>;

export type DriverList = z.infer<typeof driverList>;
export type UpdateDriverList = z.infer<typeof updateDriverList>;

export type InsertDriverPosition = z.infer<typeof insertDriverPositionSchema>;
export type SelectDriverPosition = z.infer<typeof selectDriverPositionSchema>;
