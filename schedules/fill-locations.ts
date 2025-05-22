import { db } from "@/db";
import { geocodeAddress } from "@/helpers/geocode-address";
import { locations } from "@/db/schemas/locations";
import { and, eq, isNull } from "drizzle-orm";

(async () => {
  try {
    await db.transaction(async (tx) => {
      const _locations = await tx.query.locations.findMany({
        where: and(isNull(locations.lat), isNull(locations.lng)),
      });

      await Promise.all(
        _locations.map(async (loc) => {
          const { lat, lng } = await geocodeAddress(loc.formattedAddress);
          await tx
            .update(locations)
            .set({ lat, lng })
            .where(eq(locations.id, loc.id))
            .execute();
        })
      );
    });
  } catch (error) {
    console.error(error);
  } finally {
    await db.$client.end();
  }
})();
