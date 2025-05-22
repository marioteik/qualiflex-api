import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { validator } from "hono/validator";
import { z } from "zod";
import { adminRoleMiddleware, type Env } from "@/middlewares";
import { db } from "@/db";
import {
  and,
  DrizzleError,
  eq,
  getTableColumns,
  isNull,
  or,
  ilike,
} from "drizzle-orm";
import { supabase } from "@/supabase/server";
import { users } from "@/db/schemas/auth";
import { roles, usersToRoles } from "@/db/schemas/roles";
import { insertUser, updateUser, userZodSchema } from "@/schemas/auth";
import { insertUsersToRolesSchema } from "@/schemas/roles";
import { profiles } from "@/db/schemas/profile";
import {
  seamstress,
  seamstress as seamstressTable,
  seamstressToUsers,
} from "@/db/schemas/seamstress";
import { businessInfos } from "@/db/schemas/business-info";

const router = new Hono<Env>();

router.use(adminRoleMiddleware);

export function add55IfDontHave<T>(phone?: string): T {
  if (!phone) return (phone ?? "") as T;

  if (!phone.startsWith("55")) {
    return `55${phone}` as T;
  }

  return phone as T;
}

export function removeStarting55(phone: string): string {
  if (phone.startsWith("55")) {
    return phone.slice(2);
  }
  return phone;
}

export const usersRouter = router
  .get("/", async (c) => {
    const res = await db
      .select({
        ...getTableColumns(users),
        profile: profiles,
        role: roles,
        phone: users.phone,
        seamstress: seamstressToUsers.seamstressId,
      })
      .from(users)
      .leftJoin(profiles, eq(users.id, profiles.id))
      .leftJoin(usersToRoles, eq(users.id, usersToRoles.userId))
      .leftJoin(seamstressToUsers, eq(users.id, seamstressToUsers.userId))
      .leftJoin(roles, eq(roles.id, usersToRoles.roleId))
      .where(isNull(users.deletedAt))
      .orderBy(users.createdAt);

    const data = res.map((item) => ({
      ...item,
      roleId: item.role?.id,
      roleName: item.role?.role,
      phone: removeStarting55((item.phone as string) ?? ""),
      status: item.bannedUntil
        ? "banned"
        : item.emailConfirmedAt || item.phoneConfirmedAt
        ? "confirmed"
        : "not_confirmed",
    }));

    return c.json(data, 200);
  })
  .post("/", zValidator("json", insertUser), async (c) => {
    const validated = c.req.valid("json");

    try {
      const dataUser = await db.transaction(async (tx) => {
        const { role, seamstress, id, name, ...rest } = validated;
        let { email, phone } = rest;

        const [existingBusinessInfo] = await tx
          .select()
          .from(businessInfos)
          .leftJoin(
            seamstressTable,
            eq(businessInfos.id, seamstressTable.businessInfoId)
          )
          .leftJoin(
            seamstressToUsers,
            eq(seamstressTable.id, seamstressToUsers.seamstressId)
          )
          .leftJoin(users, eq(seamstressToUsers.userId, users.id))
          .where(
            and(
              or(ilike(businessInfos.phoneFax, `%${phone}%`)),
              isNull(users.deletedAt)
            )
          )
          .limit(1)
          .execute();

        if (existingBusinessInfo) {
          throw new Error(
            "Já existe uma costureira com esse número de telefone."
          );
        }

        const [existingUser] = phone
          ? await tx
              .select()
              .from(users)
              .where(ilike(users.phone, `%${phone}%`))
              .limit(1)
              .execute()
          : email
          ? await tx
              .select()
              .from(users)
              .where(ilike(users.email, `%${email}%`))
              .limit(1)
              .execute()
          : [];

        if (existingUser) {
          throw new Error("Número de telefone ou e-mail já está em uso.");
        }

        const { data: supabaseData, error: supabaseError } =
          await supabase.auth.admin.createUser({
            id: id,
            email: email ? email : null,
            phone: phone ? phone : null,
            email_confirm: !!email,
            phone_confirm: !!phone,
            ...rest,
          });

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        if (email) {
          await supabase.auth.admin.inviteUserByEmail(email);
        }

        const userId = supabaseData.user.id;

        if (seamstress) {
          await tx
            .insert(seamstressToUsers)
            .values({
              userId,
              seamstressId: seamstress,
            })
            .onConflictDoNothing()
            .execute();
        }

        if (role) {
          await tx
            .insert(usersToRoles)
            .values({
              userId,
              roleId: Number(role),
            })
            .onConflictDoNothing()
            .execute();
        }

        if (name) {
          await tx
            .insert(profiles)
            .values({
              id: userId,
              fullName: name,
            })
            .onConflictDoUpdate({
              target: profiles.id,
              set: { fullName: name },
            })
            .execute();
        }

        if (phone) {
          await tx
            .update(users)
            .set({
              phone: add55IfDontHave(phone),
            })
            .where(eq(users.id, userId))
            .execute();
        }

        return supabaseData.user;
      });

      return c.json(dataUser, 201);
    } catch (err: any) {
      console.error("Error creating user:", err);
      if (
        err.message.includes("Telefone ou e-mail já está em uso.") ||
        err.message.includes("Número de telefone já está registrado.")
      ) {
        return c.json({ error: err.message }, 400);
      }
      return c.json({ error: err.message || "Internal Server Error" }, 500);
    }
  })
  .put("/", zValidator("json", updateUser), async (c) => {
    const validated = c.req.valid("json");

    try {
      await db.transaction(async (tx) => {
        await tx
          .update(users)
          .set({
            ...validated,
            email: validated.email ? validated.email : null,
            phone: validated.phone ? add55IfDontHave(validated.phone) : null,
          })
          .where(eq(users.id, validated.id))
          .execute();

        if (validated.name) {
          await tx
            .insert(profiles)
            .values({
              id: validated.id,
              fullName: validated.name,
            })
            .onConflictDoUpdate({
              target: profiles.id,
              set: { fullName: validated.name },
            })
            .execute();
        }

        const role = await tx.query.usersToRoles
          .findFirst({
            where: eq(usersToRoles.userId, validated.id),
          })
          .execute();

        if (role) {
          await tx
            .update(usersToRoles)
            .set({
              roleId: Number(validated.role),
            })
            .where(eq(usersToRoles.userId, validated.id))
            .execute();

          if (validated.role === "3") {
            await tx
              .insert(seamstressToUsers)
              .values({
                userId: validated.id!,
                seamstressId: validated.seamstress!,
              })
              .onConflictDoNothing()
              .execute();

            const _seamstress = await db.query.seamstress.findFirst({
              where: eq(seamstress.id, validated.seamstress!),
            });

            await tx
              .update(businessInfos)
              .set({
                phoneFax: validated.phone,
              })
              .where(eq(businessInfos.id, _seamstress!.businessInfoId))
              .execute();
          }
        } else {
          await tx
            .delete(usersToRoles)
            .where(eq(usersToRoles.userId, validated.id))
            .execute();
        }
      });
    } catch (e) {
      console.log(e);

      return c.json(
        {
          error: (e as Error).message,
        },
        500
      );
    }

    return c.json(validated, 202);
  })
  .delete(
    "/:id",
    validator("param", async (value, c) => {
      const result = await z.string().uuid().safeParseAsync(value.id);

      if (!result.success) {
        return c.json(result, 400);
      }

      return result.data;
    }),
    async (c) => {
      const id = c.req.valid("param");

      const { data, error } = await supabase.auth.admin.deleteUser(id, true);

      if (error) {
        c.json(error, 400);
      }

      await db.delete(usersToRoles).where(eq(usersToRoles.userId, id));

      return c.json(data.user, 200);
    }
  )
  .put("/block", zValidator("json", insertUser), async (c) => {
    const validated = c.req.valid("json");

    try {
      await db
        .update(users)
        .set({
          bannedUntil: new Date(
            new Date().setFullYear(new Date().getFullYear() + 100)
          ),
        })
        .where(eq(users.id, validated.id!));
    } catch (e) {
      return c.json(e as DrizzleError, 400);
    }

    return c.json(null, 200);
  })
  .put("/unblock", zValidator("json", insertUser), async (c) => {
    const validated = c.req.valid("json");

    try {
      await db
        .update(users)
        .set({
          bannedUntil: null,
        })
        .where(eq(users.id, validated.id!));
    } catch (e) {
      return c.json(e as DrizzleError, 400);
    }

    return c.json(null, 200);
  })
  .put("/set-role", zValidator("json", insertUsersToRolesSchema), async (c) => {
    const validated = c.req.valid("json");

    try {
      const existingEntry = await db
        .select()
        .from(usersToRoles)
        .where(eq(usersToRoles.userId, validated.userId))
        .execute();

      const data = existingEntry.length
        ? await db
            .update(usersToRoles)
            .set({ roleId: validated.roleId })
            .where(eq(usersToRoles.userId, validated.userId))
            .returning()
        : await db.insert(usersToRoles).values(validated).returning();

      return c.json(data, existingEntry ? 200 : 201);
    } catch (e) {
      return c.json(e as DrizzleError, 400);
    }
  });
