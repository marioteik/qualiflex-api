import {
  type AnyPgColumn,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { roles } from "./roles";

const permissions = pgTable(
  "permissions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    permission: text("role").notNull().unique(),
    parentId: integer("parent_id").references(
      (): AnyPgColumn => permissions.id,
    ),
  },
  (table) => ({
    parentIndex: index("parent_idx").on(table.parentId),
  }),
);

const roleToPermissions = pgTable(
  "role_to_permissions",
  {
    roleId: integer("role_id")
      .notNull()
      .references(() => roles.id),
    permissionId: integer("permission_id")
      .notNull()
      .references(() => permissions.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
    };
  },
);

const roleToPermissionsRelations = relations(
  roleToPermissions,
  ({ one, many }) => ({
    role: one(roles, {
      fields: [roleToPermissions.roleId],
      references: [roles.id],
    }),
    permissions: many(permissions),
  }),
);

export { permissions, roleToPermissions, roleToPermissionsRelations };
