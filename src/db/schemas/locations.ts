import {
  index,
  numeric,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schemas/timestamps";

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    route: varchar({ length: 256 }).notNull(),
    subpremise: text("subpremise"),
    streetNumber: text("street_number").default("Sem número"),
    sublocality: text("sublocality").notNull(),
    locality: varchar({ length: 100 }).notNull(),
    administrativeAreaLevel1: text("administrative_area_level_1").notNull(),
    administrativeAreaLevel2: text("administrative_area_level_2"),
    country: text("country").notNull(),
    formattedAddress: text("formatted_address").notNull(),
    postalCode: varchar({ length: 20 }).notNull(),
    lat: numeric("lat", { precision: 9, scale: 6 }),
    lng: numeric("lng", { precision: 9, scale: 6 }),
    ...timestamps,
  },
  (table) => ({
    postalCodeIndex: index("postal_code_idx").on(table.postalCode),
    localityIndex: index("locality_idx").on(table.locality),
    routeIndex: index("route_idx").on(table.route),
    administrativeAreaIndex: index("administrative_area_idx").on(
      table.locality,
      table.administrativeAreaLevel1,
      table.country
    ),
  })
);
