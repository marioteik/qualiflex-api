import {
  index,
  pgTable,
  timestamp,
  uuid,
  integer,
  uniqueIndex,
  numeric,
} from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schemas/timestamps";
import { locations } from "@/db/schemas/locations";
import { users } from "@/db/schemas/auth";
import { shipments } from "@/db/schemas/shipments";
import { relations } from "drizzle-orm";
import { seamstress } from "@/db/schemas/seamstress";

export const routes = pgTable(
  "routes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    driverId: uuid("driver_id").references(() => users.id),
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => seamstress.id, { onDelete: "cascade" }),
    startTime: timestamp("start_time"),
    endTime: timestamp("end_time"),
    weight: integer(),
    ...timestamps,
  },
  (table) => {
    return {
      routesLocationIdIdx: index("routes_location_id_idx").on(table.locationId),
      routesShipmentIdIdx: index("routes_shipment_id_idx").on(table.shipmentId),
      routesRecipientIdIdx: index("routes_recipient_id_idx").on(
        table.recipientId
      ),
    };
  }
);

export const routesRelations = relations(routes, ({ one }) => ({
  location: one(locations, {
    fields: [routes.locationId],
    references: [locations.id],
  }),
  shipment: one(shipments, {
    fields: [routes.shipmentId],
    references: [shipments.id],
  }),
  driver: one(users, {
    fields: [routes.driverId],
    references: [users.id],
  }),
  recipient: one(seamstress, {
    fields: [routes.recipientId],
    references: [seamstress.id],
  }),
}));

export const driverPosition = pgTable("driver_position", {
  id: uuid("id").primaryKey().defaultRandom(),
  driverId: uuid("driver_id").references(() => users.id),
  lat: numeric("lat", { precision: 9, scale: 6 }),
  lng: numeric("lng", { precision: 9, scale: 6 }),
  ...timestamps,
});
