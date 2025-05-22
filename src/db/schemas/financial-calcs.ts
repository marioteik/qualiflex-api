import { numeric, pgTable, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schemas/timestamps";

export const financialCalculations = pgTable("financial_calculations", {
  id: uuid("id").primaryKey().defaultRandom(),
  icmsBase: numeric("icms_base").notNull(),
  icmsValue: numeric("icms_value").notNull(),
  stIcmsBase: numeric("st_icms_base").notNull(),
  stIcmsValue: numeric("st_icms_value").notNull(),
  fcpValue: numeric("fcp_value").notNull(),
  pisValue: numeric("pis_value").notNull(),
  totalProductValue: numeric("total_product_value").notNull(),
  freightValue: numeric("freight_value").notNull(),
  insuranceValue: numeric("insurance_value").notNull(),
  discount: numeric("discount").notNull(),
  otherExpenses: numeric("other_expenses").notNull(),
  ipiValue: numeric("ipi_value").notNull(),
  cofinsValue: numeric("cofins_value").notNull(),
  totalInvoiceValue: numeric("total_invoice_value").notNull(),
  ...timestamps,
});
