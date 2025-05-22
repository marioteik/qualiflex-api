import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/config/env";
import {
  roles,
  rolesToUsersToRolesRelations,
  usersToRoles,
  usersToRolesRelations,
} from "@/db/schemas/roles";
import { permissions, roleToPermissions } from "@/db/schemas/permissions";
import { profiles } from "@/db/schemas/profile";
import { users, usersRelations } from "@/db/schemas/auth";
import {
  businessInfos,
  businessInfosRelations,
} from "@/db/schemas/business-info";
import { financialCalculations } from "@/db/schemas/financial-calcs";
import { locations } from "@/db/schemas/locations";
import {
  orders,
  orderRelations,
  shipmentItemToOrder,
  shipmentItemToOrderRelations,
  shipmentsToOrder,
  shipmentsToOrderRelations,
} from "@/db/schemas/orders";
import { products, productsRelations } from "@/db/schemas/products";
import {
  seamstress,
  seamstressRelations,
  seamstressToUsers,
  seamstressToUsersRelations,
} from "@/db/schemas/seamstress";
import {
  shipmentItems,
  shipmentItemsRelations,
  units,
} from "@/db/schemas/shipment-items";
import {
  shipmentRelations,
  shipments,
  shipmentsToUsers,
} from "@/db/schemas/shipments";
import {
  chatMessages,
  chatMessagesRelations,
} from "@/db/schemas/chat-messages";
import { rooms, roomsRelations } from "@/db/schemas/chat-rooms";
import { driverPosition, routes, routesRelations } from "@/db/schemas/routes";
import { productions, productionsRelations } from "@/db/schemas/productions";
import { shipmentImports } from "./schemas/shipment-imports";

const connectionString = env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Could not connect with the database");
}

export const client = postgres(connectionString, { prepare: false });
export const db = drizzle({
  client: client,
  schema: {
    roles,
    usersToRoles,
    usersToRolesRelations,
    rolesToUsersToRolesRelations,
    permissions,
    roleToPermissions,
    profiles,
    users,
    usersRelations,
    businessInfos,
    businessInfosRelations,
    financialCalculations,
    locations,
    orders,
    orderRelations,
    shipmentsToOrder,
    shipmentsToOrderRelations,
    shipmentItemToOrder,
    shipmentItemToOrderRelations,
    products,
    productsRelations,
    productions,
    productionsRelations,
    seamstress,
    seamstressRelations,
    seamstressToUsers,
    seamstressToUsersRelations,
    units,
    shipmentItems,
    shipmentItemsRelations,
    shipments,
    shipmentRelations,
    shipmentsToUsers,
    chatMessages,
    chatMessagesRelations,
    rooms,
    roomsRelations,
    routes,
    routesRelations,
    driverPosition,
    shipmentImports,
  },
});
