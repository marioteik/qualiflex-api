import { z } from "zod";

const insertRoleSchema = z.object({
  role: z
    .string()
    .min(1, "Role is required and cannot be empty")
    .regex(/^\S+$/, "Role cannot contain spaces"),
});

const selectRoleSchema = insertRoleSchema.merge(
  z.object({
    id: z.number(),
  }),
);

const insertUsersToRolesSchema = z.object({
  userId: z.string().uuid("User ID must be a valid UUID"),
  roleId: z.number().int("Role ID must be an integer"),
});

const selectUsersToRolesSchema = insertUsersToRolesSchema.merge(
  z.object({
    id: z.string().uuid().optional(),
  }),
);

type InsertRole = z.infer<typeof insertRoleSchema>;
type SelectRole = z.infer<typeof selectRoleSchema>;
type InsertUsersToRoles = z.infer<typeof insertUsersToRolesSchema>;
type SelectUsersToRoles = z.infer<typeof selectUsersToRolesSchema>;

export {
  insertUsersToRolesSchema,
  selectUsersToRolesSchema,
  insertRoleSchema,
  selectRoleSchema,
  type InsertUsersToRoles,
  type SelectUsersToRoles,
  type InsertRole,
  type SelectRole,
};
