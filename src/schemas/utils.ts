import { z } from "zod";

export const dateParser = z.date().or(
  z
    .string()
    .refine((value) => !isNaN(new Date(value).getTime()), {
      message: "Invalid date string",
    })
    .transform((value) => new Date(value)),
);
