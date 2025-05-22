import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { validator } from "hono/validator";
import { z } from "zod";
import { adminRoleMiddleware, type Env } from "@/middlewares";
import { roles } from "@/db/schemas/roles";
import { insertRoleSchema, selectRoleSchema } from "@/schemas/roles";

const router = new Hono<Env>();

router.use(adminRoleMiddleware);

export const rolesRouter = router
  .get("/", async (c) => {
    const _roles = await db.query.roles.findMany({
      orderBy: roles.id,
    });

    return c.json(_roles);
  })
  .post("/", zValidator("json", insertRoleSchema), async (c) => {
    const validated = c.req.valid("json");

    const [role] = await db.insert(roles).values(validated).returning();

    return c.json(role, 201);
  })
  .put("/", zValidator("json", selectRoleSchema), async (c) => {
    const validated = c.req.valid("json");

    const [role] = await db
      .update(roles)
      .set(validated)
      .where(eq(roles.id, validated.id))
      .returning();

    return c.json(role, 202);
  })
  .delete(
    "/:id",
    validator("param", async (value, c) => {
      const result = await z
        .number()
        .or(z.string().transform(Number))
        .safeParseAsync(value.id);

      if (!result.success) {
        return c.json(result, 400);
      }

      return result.data;
    }),
    async (c) => {
      const id = c.req.valid("param");

      await db.delete(roles).where(eq(roles.id, id));

      return c.json({ ok: true }, 200);
    }
  );
