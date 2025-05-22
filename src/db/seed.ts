import { roles, usersToRoles } from "@/db/schemas/roles";
import { db } from "@/db";

const seed = async () => {
  await db.transaction(async (tx) => {
    await tx
      .insert(roles)
      .values([
        {
          id: 1,
          role: "Admin",
        },
        {
          id: 2,
          role: "Staff",
        },
        {
          id: 3,
          role: "Costureira",
        },
        {
          id: 4,
          role: "Motorista",
        },
      ])
      .onConflictDoNothing();

    await tx.insert(usersToRoles).values({
      userId: "ab7bb57e-7c78-4828-a178-aea9ac67dc68",
      roleId: 1,
    });
  });
};

seed().then(() => {
  console.log("Finished seed!");
  process.exit();
});
