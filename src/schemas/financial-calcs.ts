import { z } from "zod";

const insertFinancialCalculationSchema = z.object({
  icmsBase: z.number().min(0, "ICMS base must be a non-negative number"),
  icmsValue: z.number().min(0, "ICMS value must be a non-negative number"),
  stIcmsBase: z.number().min(0, "ST ICMS base must be a non-negative number"),
  stIcmsValue: z.number().min(0, "ST ICMS value must be a non-negative number"),
  fcpValue: z.number().min(0, "FCP value must be a non-negative number"),
  pisValue: z.number().min(0, "PIS value must be a non-negative number"),
  totalProductValue: z
    .number()
    .min(0, "Total product value must be a non-negative number"),
  freightValue: z
    .number()
    .min(0, "Freight value must be a non-negative number"),
  insuranceValue: z
    .number()
    .min(0, "Insurance value must be a non-negative number"),
  discount: z.number().min(0, "Discount must be a non-negative number"),
  otherExpenses: z
    .number()
    .min(0, "Other expenses must be a non-negative number"),
  ipiValue: z.number().min(0, "IPI value must be a non-negative number"),
  cofinsValue: z.number().min(0, "COFINS value must be a non-negative number"),
  totalInvoiceValue: z
    .number()
    .min(0, "Total invoice value must be a non-negative number"),
});

const selectFinancialCalculationSchema = insertFinancialCalculationSchema.merge(
  z.object({
    id: z.string().uuid(),
  }),
);

type InsertFinancialCalculation = z.infer<
  typeof insertFinancialCalculationSchema
>;
type SelectFinancialCalculation = z.infer<
  typeof selectFinancialCalculationSchema
>;

export {
  insertFinancialCalculationSchema,
  selectFinancialCalculationSchema,
  type InsertFinancialCalculation,
  type SelectFinancialCalculation,
};
