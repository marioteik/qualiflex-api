import { createFactory } from "hono/factory";
import { db } from "@/db";
import type { Context } from "hono";
import { supabase } from "@/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import type { Server } from "socket.io";
import { or } from "drizzle-orm";

export type Env = {
  Variables: {
    supabase: SupabaseClient;
    userId?: string;
    phone?: string;
    seamstressId?: string;
    io: Server;
  };
};

const factory = createFactory();

export const checkAuthed = async (c: Context) => {
  try {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new Error("The token was not provided");
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === "string") {
      throw new Error(decoded);
    }

    if (!decoded?.sub) {
      throw new Error("Expired Token");
    }

    let phone = decoded?.phone as string;

    if (phone?.startsWith("55")) {
      phone = phone?.slice(2);
    }

    c.set("userId", decoded?.sub);
    c.set("phone", phone);
    c.set("supabase", supabase);
  } catch (e) {
    console.log((e as Error).message);

    return { isAuth: false };
  }
};

export const authedMiddleware = factory.createMiddleware(async (c, next) => {
  const error = await checkAuthed(c);

  if (error) {
    return c.json(error, 404);
  }

  await next();
});

export const staffRoleMiddleware = factory.createMiddleware(async (c, next) => {
  const error = await checkAuthed(c);

  if (error) {
    return c.json(error, 404);
  }

  const userId = c.get("userId");

  const userToRoles = await db.query.usersToRoles.findFirst({
    where: (item, { eq, and }) =>
      and(eq(item.userId, userId), or(eq(item.roleId, 2), eq(item.roleId, 1))),
  });

  if (!userToRoles) {
    return c.json({ isBackoffice: false }, 404);
  }

  await next();
});

export const adminRoleMiddleware = factory.createMiddleware(async (c, next) => {
  const error = await checkAuthed(c);

  if (error) {
    return c.json(error, 404);
  }

  const userId = c.get("userId");

  const userToRoles = await db.query.usersToRoles.findFirst({
    where: (item, { eq, and }) =>
      and(eq(item.userId, userId), eq(item.roleId, 1)),
  });

  if (!userToRoles) {
    return c.json({ isAdmin: false }, 404);
  }

  await next();
});
