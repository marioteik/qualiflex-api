import {
  index,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "@/db/schemas/timestamps";
import { users } from "@/db/schemas/auth";
import { financialCalculations } from "@/db/schemas/financial-calcs";
import { seamstress } from "@/db/schemas/seamstress";
import { relations } from "drizzle-orm";
import { shipmentItems } from "@/db/schemas/shipment-items";
import { routes } from "@/db/schemas/routes";

export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull(),
    accessKey: text("access_key").unique(),
    series: text("series").notNull(),
    type: text("type").notNull(),
    authorizationProtocol: text("authorization_protocol"),
    issueDate: timestamp("issue_date").notNull(),
    entryExitDate: timestamp("entry_exit_date"),
    entryExitTime: time("entry_exit_time"),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => seamstress.id, { onDelete: "cascade" }),
    financialCalcId: uuid("financial_calc_id")
      .notNull()
      .references(() => financialCalculations.id, { onDelete: "cascade" }),
    transportationType: text("transportation_type").notNull().default("1"),
    confirmedAt: timestamp("confirmed_at"),
    deliveredAt: timestamp("delivered_at"),
    finishedAt: timestamp("finished_at"),
    collectedAt: timestamp("collected_at"),
    refusedAt: timestamp("refused_at"),
    archivedAt: timestamp("archived_at"),
    systemEstimation: timestamp("system_estimation"),
    informedEstimation: timestamp("informed_estimation"),
    ...timestamps,
  },
  (table) => ({
    numberIndex: index("number_idx").on(table.number),
    accessKeyIndex: index("access_key_idx").on(table.accessKey),
    issueDateIndex: index("issue_date_idx").on(table.issueDate),
    recipientIdIndex: index("recipient_id_idx").on(table.recipientId),
    shipmentsConfirmedAtIndex: index("shipments_confirmed_at_idx").on(
      table.confirmedAt
    ),
    shipmentsDeliveredAtIndex: index("shipments_delivered_at_idx").on(
      table.deliveredAt
    ),
    shipmentsFinishedAtIndex: index("shipments_finished_at_idx").on(
      table.finishedAt
    ),
    shipmentsCollectedAtIndex: index("shipments_collected_at_idx").on(
      table.collectedAt
    ),
    financialCalcIdIndex: index("financial_calc_id_idx").on(
      table.financialCalcId
    ),
  })
);

export const shipmentRelations = relations(shipments, ({ one, many }) => ({
  recipient: one(seamstress, {
    fields: [shipments.recipientId],
    references: [seamstress.id],
  }),
  financialCalc: one(financialCalculations, {
    fields: [shipments.financialCalcId],
    references: [financialCalculations.id],
  }),
  currentRoutes: many(routes),
  items: many(shipmentItems),
}));

export const shipmentsToUsers = pgTable(
  "shipments_to_users",
  {
    shipmentId: uuid("shipment_id")
      .notNull()
      .references(() => shipments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.shipmentId, table.userId] }),
    };
  }
);
