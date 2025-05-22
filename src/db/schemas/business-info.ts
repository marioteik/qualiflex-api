import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schemas/timestamps";
import { locations } from "@/db/schemas/locations";
import { seamstress } from "@/db/schemas/seamstress";
import { relations } from "drizzle-orm";

export const businessInfos = pgTable("business_infos", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameCorporateReason: text("name_corporate_reason").notNull(),
  cnpjCpf: text("cnpj_cpf").notNull(),
  email: text("email"),
  phoneFax: text("phone_fax"),
  contact: text("contact"),
  stateRegistration: text("state_registration"),
  tradeName: text("trade_name"),
  modificationDate: text("modification_date"),
  ...timestamps,
});

export const businessInfosRelations = relations(businessInfos, ({ one }) => ({
  seamstress: one(seamstress, {
    fields: [businessInfos.id],
    references: [seamstress.businessInfoId],
  }),
}));
