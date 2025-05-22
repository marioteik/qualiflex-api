import { z } from "zod";

const insertPermissionSchema = z.object({
  permission: z
    .string()
    .min(1, "Permission is required and cannot be empty")
    .regex(/^\S+$/, "Permission cannot contain spaces"),
  parentId: z.number().nullable().optional(),
});

const selectPermissionSchema = insertPermissionSchema.merge(
  z.object({
    id: z.number(),
  }),
);

const permissionsRecursiveSchema = selectPermissionSchema.merge(
  z.object({
    children: z.lazy(() => z.array(permissionsRecursiveSchema)).optional(),
  }),
);

type InsertPermission = z.infer<typeof insertPermissionSchema>;
type SelectPermission = z.infer<typeof selectPermissionSchema>;
type PermissionRecursive = z.infer<typeof permissionsRecursiveSchema>;

export {
  insertPermissionSchema,
  selectPermissionSchema,
  permissionsRecursiveSchema,
  type InsertPermission,
  type SelectPermission,
  type PermissionRecursive,
};
