import { pgSchema, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./timestamps";
import { relations } from "drizzle-orm";
import { profiles } from "@/db/schemas/profile";
import { usersToRoles } from "@/db/schemas/roles";
import { seamstress, seamstressToUsers } from "@/db/schemas/seamstress";

export const authSchema = pgSchema("auth");

export const users = authSchema.table("users", {
  id: uuid("id").primaryKey(),
  email: varchar(),
  phone: varchar(),
  emailConfirmedAt: timestamp("email_confirmed_at"),
  phoneConfirmedAt: timestamp("phone_confirmed_at"),
  lastSignInAt: timestamp("last_sign_in_at"),
  bannedUntil: timestamp("banned_until"),
  ...timestamps,
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.id],
  }),
  usersToRoles: many(usersToRoles),
  seamstress: one(seamstressToUsers, {
    fields: [users.id],
    references: [seamstressToUsers.userId],
  }),
}));
