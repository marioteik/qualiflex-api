import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { supabase } from "@/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/config/env";
import { users } from "@/db/schemas/auth";
import { db } from "@/db";
import { and, eq, getTableColumns, ilike, isNull, or, sql } from "drizzle-orm";
import { authZodSchema, refreshSchema } from "@/schemas/auth";
import { businessInfos } from "@/db/schemas/business-info";
import { seamstress, seamstressToUsers } from "@/db/schemas/seamstress";
import { roles, usersToRoles } from "@/db/schemas/roles";
import { profiles } from "@/db/schemas/profile";

const router = new Hono();

export const authRouter = router
  .post("/sign-in", zValidator("json", authZodSchema), async (c) => {
    const validated = c.req.valid("json");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email ?? "",
      password: validated.password ?? "",
    });

    if (error) {
      return c.json(error.code, 401);
    }

    console.log(data.session); 

    return c.json(data.session, 200);
  })
  .post("/sign-up", zValidator("json", authZodSchema), async (c) => {
    const validated = c.req.valid("json");

    return c.json({}, 201);
  })
  .post("/sign-out", async (c) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return c.json(error.code, 401);
    }

    return c.json({ message: "Sessão encerrada com sucesso." }, 200);
  })
  .post("/phone", zValidator("json", authZodSchema), async (c) => {
    const validated = c.req.valid("json");
    const phone = "+55" + validated.phone;
    let type = validated.type;

    if (!type) {
      type = "sms";
    }

    const userRecord = await db.query.users.findFirst({
      where: ilike(users.phone, `%${validated.phone}%`),
    });

    const businessInfoOrUserRecord =
      userRecord ||
      (await db.query.businessInfos.findFirst({
        where: ilike(businessInfos.phoneFax, `%${validated.phone}%`),
      }));

    if (!businessInfoOrUserRecord) {
      return c.json(
        { message: "Não foi encontrado usuário com esse número de telefone." },
        401
      );
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      phone,
      channel: type,
    });

    if (error) {
      console.log(error);
      return c.json(error.code, 401);
    }

    return c.json(data, 201);
  })
  .post("/phone-otp", zValidator("json", authZodSchema), async (c) => {
    const validated = c.req.valid("json");
    const phone = "+55" + validated.phone;
    const code = validated.code?.trim();

    if (!code) {
      return c.json({ message: "O código é obrigatório." }, 401);
    }

    const [userRecord, businessInfoRecord] = await Promise.all([
      db.query.users.findFirst({
        where: ilike(users.phone, `%${validated.phone}%`),
      }),
      db.query.businessInfos.findFirst({
        where: ilike(businessInfos.phoneFax, `%${validated.phone}%`),
      }),
    ]);

    if (!userRecord && !businessInfoRecord) {
      return c.json(
        { message: "Não foi encontrado usuário com esse número de telefone." },
        401
      );
    }

    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });

    if (error) {
      console.error(error);
      return c.json({ message: error.code }, 401);
    }

    if (data.user && !data.user.phone_confirmed_at) {
      await db
        .update(users)
        .set({
          phoneConfirmedAt: new Date(),
        })
        .where(eq(users.id, data.user.id));
    }

    if (businessInfoRecord && data.user) {
      const [profileRecord] = await db
        .select()
        .from(profiles)
        .where(eq(profiles.id, data.user.id));

      const contact =
        businessInfoRecord.contact?.trim() ||
        businessInfoRecord.tradeName?.trim() ||
        businessInfoRecord.nameCorporateReason.trim();

      if (!profileRecord.fullName) {
        await db
          .insert(profiles)
          .values({
            id: data.user.id,
            fullName: contact,
          })
          .onConflictDoUpdate({
            target: profiles.id,
            set: { fullName: contact },
          })
          .execute();
      }

      await linkSeamstressAndAssignRole(businessInfoRecord.id, data.user.id);
    }

    return c.json(data, 201);
  })
  .get("/verify", async (c) => {
    const token = c.req.header("Authorization");

    if (!token) {
      return c.json({ verify: false }, 200);
    }

    try {
      const user_supabase = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_ANON_KEY,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token.replace("Bearer ", "")}`,
            },
          },
        }
      );

      const {
        data: { user },
        error,
      } = await user_supabase.auth.getUser();

      if (error) {
        return c.json({ verify: false }, 200);
      }

      const [userRecord] = await db
        .select({ banned: users.bannedUntil })
        .from(users)
        .where(eq(users.id, user?.id ?? ""));

      if (userRecord.banned) {
        return c.json({ verify: false }, 200);
      }

      const usersToRolesRecord = await db.query.usersToRoles.findFirst({
        where: and(eq(usersToRoles.userId, user?.id ?? "")),
        with: {
          role: true,
          user: {
            where: or(
              eq(users.phone, user?.phone ?? ""),
              eq(users.email, user?.email ?? "")
            ),
          },
        },
      });

      return c.json({ verify: true, role: usersToRolesRecord?.role }, 200);
    } catch (e) {
      console.log(e);
      return c.notFound();
    }
  })
  .post("/refresh", zValidator("json", refreshSchema), async (c) => {
    const { refresh_token } = c.req.valid("json");

    try {
      const { data, error } = await supabase.auth.refreshSession({
        refresh_token,
      });

      if (error) {
        console.error("Failed to refresh session:", error);
        return c.json(
          { message: "Failed to refresh session", error: error.message },
          401
        );
      }

      return c.json(data, 200);
    } catch (e: any) {
      console.error("Unexpected error refreshing session:", e);
      return c.json({ message: "Unexpected error refreshing session" }, 500);
    }
  });

async function linkSeamstressAndAssignRole(
  businessInfoId: string,
  supabaseUserId: string
) {
  const seamstressRecord = await db.query.seamstress.findFirst({
    where: eq(seamstress.businessInfoId, businessInfoId),
  });

  if (!seamstressRecord) return;

  const seamstressToUserRecord = await db.query.seamstressToUsers.findFirst({
    where: and(
      eq(seamstressToUsers.userId, supabaseUserId),
      eq(seamstressToUsers.seamstressId, seamstressRecord.id)
    ),
  });

  if (!seamstressToUserRecord) {
    await db
      .insert(seamstressToUsers)
      .values({
        userId: supabaseUserId,
        seamstressId: seamstressRecord.id,
      })
      .onConflictDoNothing();
  }

  const roleRecord = await db.query.roles.findFirst({
    where: eq(roles.role, "Costureira"),
  });

  if (roleRecord) {
    await db
      .insert(usersToRoles)
      .values({
        userId: supabaseUserId,
        roleId: roleRecord.id,
      })
      .onConflictDoNothing();
  }
}
