import { z } from "zod";
import { timestamps } from "./timestamps";
import { selectProfileSchema } from "./profile";

const matchPhone = /^\(?\d{2}\)?\s?(?:9\d{4}|\d{4})-?\d{4}$/;

const driverSchema = timestamps.merge(
  z.object({
    id: z.string(),
    phone: z.string().regex(matchPhone).optional(),
    profile: selectProfileSchema,
    role: z.object({
      id: z.number(),
      role: z.string(),
    }),
  }),
);

type Driver = z.infer<typeof driverSchema>;

export { driverSchema, type Driver };
