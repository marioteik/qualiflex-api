import { integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./auth";

const roles = pgTable("roles", {
  id: integer("id").generatedByDefaultAsIdentity().primaryKey(),
  role: text("role").notNull().unique(),
});

const usersToRoles = pgTable(
  "users_to_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.roleId] }),
    };
  },
);

const usersToRolesRelations = relations(usersToRoles, ({ one }) => ({
  user: one(users, {
    fields: [usersToRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [usersToRoles.roleId],
    references: [roles.id],
  }),
}));

// Define the relations for the roles table
const rolesToUsersToRolesRelations = relations(roles, ({ many }) => ({
  usersToRoles: many(usersToRoles),
}));

export {
  roles,
  usersToRoles,
  usersToRolesRelations,
  rolesToUsersToRolesRelations,
};
