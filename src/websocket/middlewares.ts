import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { supabase } from "@/supabase/server";
import { db } from "@/db";
import { and, eq, or } from "drizzle-orm";
import { roles, usersToRoles } from "@/db/schemas/roles";
import { users } from "@/db/schemas/auth";

export const checkAuthedBackoffice = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new Error("The token was not provided");
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === "string" || !decoded?.sub) {
      throw new Error("Invalid or expired token");
    }

    const [user] = await db
      .select({
        userId: usersToRoles.userId,
        roleId: usersToRoles.roleId,
        role: roles.role,
      })
      .from(usersToRoles)
      .leftJoin(users, eq(users.id, usersToRoles.userId))
      .leftJoin(roles, eq(roles.id, usersToRoles.roleId))
      .where(
        and(
          eq(usersToRoles.userId, decoded.sub),
          or(eq(roles.role, "Admin"), eq(roles.role, "Staff"))
        )
      )
      .limit(1);

    if (!user) {
      throw new Error("User is not a backoffice user");
    }

    socket.user = {
      userId: decoded.sub,
      supabase,
    };

    return next();
  } catch (e) {
    console.error("Authentication error:", (e as Error).message);
    next(new Error("Unauthorized"));
  }
};

export const checkAuthed = (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new Error("The token was not provided");
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (typeof decoded === "string" || !decoded?.sub) {
      throw new Error("Invalid or expired token");
    }

    let phone = decoded?.phone as string;
    if (phone?.startsWith("55")) {
      phone = phone.slice(2);
    }

    socket.user = {
      userId: decoded.sub,
      phone,
      supabase,
    };

    next();
  } catch (e) {
    console.error("Authentication error:", (e as Error).message);
    next(new Error("Unauthorized"));
  }
};
