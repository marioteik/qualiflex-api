// /schemas/zodSchemas/seamstressSchema.ts
import { z } from "zod";
import { insertLocationSchema, selectLocationSchema } from "./locations";
import {
  insertBusinessInfoSchema,
  selectBusinessInfoSchema,
} from "./business-info";
import { timestamps } from "./timestamps";

const insertSeamstressSchema = timestamps.merge(
  z.object({
    internalCode: z.string().optional(),
    location: insertLocationSchema,
    businessInfo: insertBusinessInfoSchema,
  }),
);

const selectSeamstressSchema = insertSeamstressSchema.merge(
  z.object({
    id: z.string().uuid(),
    location: selectLocationSchema,
    businessInfo: selectBusinessInfoSchema,
    user: z
      .object({
        userId: z.string().uuid(),
        seamstressId: z.string().uuid(),
      })
      .optional(),
  }),
);

type InsertSeamstress = z.infer<typeof insertSeamstressSchema>;
type SelectSeamstress = z.infer<typeof selectSeamstressSchema>;

export {
  insertSeamstressSchema,
  selectSeamstressSchema,
  type InsertSeamstress,
  type SelectSeamstress,
};
