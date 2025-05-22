import { z } from "zod";
import { dateParser } from "./utils";

export const timestamps = z.object({
  updatedAt: dateParser.nullable(),
  createdAt: dateParser,
  deletedAt: dateParser.nullable(),
});
