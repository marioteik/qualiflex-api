import { z } from "zod";
import { dateParser } from "./utils";

const insertProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .optional(),
  fullName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  updatedAt: dateParser.nullable(),
});

const selectProfileSchema = insertProfileSchema.merge(
  z.object({
    id: z.string().uuid(),
  }),
);

type InsertProfile = z.infer<typeof insertProfileSchema>;
type SelectProfile = z.infer<typeof selectProfileSchema>;

export {
  insertProfileSchema,
  selectProfileSchema,
  type InsertProfile,
  type SelectProfile,
};
