import { z } from "zod";

const insertBusinessInfoSchema = z.object({
  nameCorporateReason: z
    .string()
    .min(1, "Name or corporate reason is required and cannot be empty"),
  cnpjCpf: z.string().min(1, "CNPJ or CPF is required and cannot be empty"),
  email: z.string().email().nullable().optional(),
  contact: z.string().nullable().optional(),
  phoneFax: z.string().optional(),
  stateRegistration: z.string().optional(),
  modificationDate: z.string().optional(),
  tradeName: z.string().optional(),
});

const selectBusinessInfoSchema = insertBusinessInfoSchema.merge(
  z.object({
    id: z.string().uuid(),
  }),
);

type InsertBusinessInfo = z.infer<typeof insertBusinessInfoSchema>;
type SelectBusinessInfo = z.infer<typeof selectBusinessInfoSchema>;

export {
  insertBusinessInfoSchema,
  selectBusinessInfoSchema,
  type InsertBusinessInfo,
  type SelectBusinessInfo,
};
