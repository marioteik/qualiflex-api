import { check, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./auth";
import { timestamps } from "./timestamps";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid()
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .primaryKey(),
    username: text("username").unique(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    website: text("website"),
    ...timestamps,
  },
  (table) => ({
    checkConstraint: check(
      "username_length",
      sql`LENGTH
            (
            ${table.username}
            )
            >=
            3`,
    ),
    usernameIdx: index("username_idx").on(table.username),
  }),
);
