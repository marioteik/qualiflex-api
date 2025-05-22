import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validator } from "hono/validator";
import { z } from "zod";
import {
  adminRoleMiddleware,
  type Env,
  staffRoleMiddleware,
} from "@/middlewares";
import { db } from "@/db";
import { DrizzleError, eq, isNull } from "drizzle-orm";
import { getTableColumns } from "drizzle-orm/utils";
import { supabase } from "@/supabase/server";
import { users } from "@/db/schemas/auth";
import { profiles } from "@/db/schemas/profile";
import { roles, usersToRoles } from "@/db/schemas/roles";
import { insertUser } from "@/schemas/auth";
import { insertUsersToRolesSchema } from "@/schemas/roles";

const router = new Hono<Env>();

router.use(staffRoleMiddleware);

export const userByType = router.get("/drivers", async (c) => {
  const res = await db.query.users.findMany({
    with: {
      usersToRoles: true,
    },
  });

  return c.json([]);
});
