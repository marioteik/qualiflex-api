import { z } from "zod";

const insertProductSchema = z.object({
  code: z.string().min(1, "Code is required and cannot be empty"),
  description: z.string().min(1, "Description is required and cannot be empty"),
  ncm: z.string().min(1, "NCM is required and cannot be empty"),
  cst: z.optional(z.string()),
  cfop: z.string().min(1, "CFOP is required and cannot be empty"),
  unit: z.string().min(1, "Unit is required and cannot be empty"),
  quantity: z.string().min(0, "Quantity must be a non-negative number"),
  unitPrice: z.string().default("0"),
  totalPrice: z.string().default("0"),
  bcIcms: z.string().min(0, "BC ICMS must be a non-negative number"),
  icmsValue: z.string().min(0, "ICMS value must be a non-negative number"),
  ipiValue: z.string().min(0, "IPI value must be a non-negative number"),
  icmsRate: z.string().min(0, "ICMS rate must be a non-negative number"),
  ipiRate: z.string().min(0, "IPI rate must be a non-negative number"),
  order: z.string().optional(),
});

const selectProductSchema = insertProductSchema.merge(
  z.object({
    id: z.string().uuid(),
  }),
);

type InsertProduct = z.infer<typeof insertProductSchema>;
type SelectProduct = z.infer<typeof selectProductSchema>;

export {
  insertProductSchema,
  selectProductSchema,
  type InsertProduct,
  type SelectProduct,
};
