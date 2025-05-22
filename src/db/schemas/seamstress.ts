// /schemas/pgTables/seamstress.ts
import { pgTable, primaryKey, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schemas/timestamps";
import { locations } from "./locations";
import { businessInfos } from "./business-info";
import { relations } from "drizzle-orm";
import { users } from "@/db/schemas/auth";

export const seamstress = pgTable("seamstress", {
  id: uuid("id").primaryKey().defaultRandom(),
  internalCode: varchar("internal_code", { length: 10 }).unique().notNull(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "cascade" }),
  businessInfoId: uuid("business_info_id")
    .notNull()
    .references(() => businessInfos.id, { onDelete: "cascade" }),
  ...timestamps,
});

export const seamstressRelations = relations(seamstress, ({ one }) => ({
  location: one(locations, {
    fields: [seamstress.locationId],
    references: [locations.id],
  }),
  businessInfo: one(businessInfos, {
    fields: [seamstress.businessInfoId],
    references: [businessInfos.id],
  }),
  user: one(seamstressToUsers, {
    fields: [seamstress.id],
    references: [seamstressToUsers.seamstressId],
  }),
}));

export const seamstressToUsers = pgTable(
  "seamstress_to_users",
  {
    seamstressId: uuid("seamstress_id")
      .notNull()
      .references(() => seamstress.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.seamstressId, table.userId] }),
    };
  }
);

export const seamstressToUsersRelations = relations(
  seamstressToUsers,
  ({ one }) => ({
    user: one(users, {
      fields: [seamstressToUsers.userId],
      references: [users.id],
    }),
    seamstress: one(seamstress, {
      fields: [seamstressToUsers.seamstressId],
      references: [seamstress.id],
    }),
  })
);
