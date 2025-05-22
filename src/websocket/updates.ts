import { type Server } from "socket.io";
import { supabase } from "@/supabase/server";
import { db } from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { shipments } from "@/db/schemas/shipments";
import { seamstressToUsers } from "@/db/schemas/seamstress";
import { checkAuthed, checkAuthedBackoffice } from "./middlewares";
import { differenceInDays } from "date-fns";
import type { SelectShipment } from "@/db/schemas/shipments";
import { determineStatus } from "@/helpers/determine-status";
import { keysToCamel } from "@/helpers/snake-to-camelcase";
import { routes } from "@/db/schemas/routes";
import type {
  InsertDriverPosition,
  SelectDriverPosition,
  SelectRoute,
} from "@/db/schemas/routes";

export const updatesChannel = (io: Server) => {
  const realtimeChannel = supabase
    .channel("shipments")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "shipments" },
      async (payload) => {
        const shipment = await db.query.shipments.findFirst({
          where: eq(shipments.id, (payload as unknown as { id: string }).id),
          with: {
            recipient: {
              with: {
                businessInfo: true,
                location: true,
              },
            },
            financialCalc: true,
            items: {
              with: {
                product: true,
              },
            },
          },
        });

        if (!shipment) return;

        const offsetDays = differenceInDays(
          shipment.informedEstimation!,
          shipment.systemEstimation!
        );
        const status = determineStatus(shipment as unknown as SelectShipment);

        console.log("New shipment inserted:", shipment.id);

        // -- SEAMSTRESS EMIT --
        // Send to the seamstress room matching this shipment’s recipientId
        seamstressNamespace
          .to(shipment.recipientId)
          .emit("shipment:new", { ...shipment, status });

        // -- BACKOFFICE EMIT --
        // Emit to everyone in the backoffice namespace
        backofficeNamespace.emit("shipment:new", {
          ...shipment,
          offsetDays,
          status,
        });
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "shipments" },
      async (payload) => {
        const shipment = await db.query.shipments.findFirst({
          where: eq(shipments.id, payload.new.id),
          with: {
            recipient: {
              with: {
                businessInfo: true,
                location: true,
              },
            },
            financialCalc: true,
            items: {
              with: {
                product: true,
              },
            },
          },
        });

        if (!shipment) return;

        // For backoffice: calculate offsetDays, status
        const offsetDays = differenceInDays(
          shipment.informedEstimation!,
          shipment.systemEstimation!
        );
        const status = determineStatus(shipment as unknown as SelectShipment);

        console.log("Shipment updated:", shipment.id);

        // -- SEAMSTRESS EMIT --
        seamstressNamespace
          .to(shipment.recipientId)
          .emit("shipment:update", { ...shipment, status });

        // -- BACKOFFICE EMIT --
        backofficeNamespace.emit("shipment:update", {
          ...shipment,
          offsetDays,
          status,
        });
      }
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "shipments" },
      (payload) => {
        // You can implement seamstressNamespace or backofficeNamespace logic similarly
        console.log("Shipment deleted:", payload);
      }
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "routes" },
      async (payload) => {
        const newRoute = payload.new as SelectRoute;

        const routesRecord = await db.query.routes.findFirst({
          where: and(eq(routes.id, newRoute.id)),
          with: {
            shipment: {
              with: {
                items: true,
              },
            },
            location: true,
            recipient: {
              with: {
                businessInfo: true,
              },
            },
          },
        });

        const shipment = routesRecord?.shipment;

        const status = determineStatus(shipment as unknown as SelectShipment);

        const route = {
          ...routesRecord,
          shipment: {
            ...shipment,
            status,
          },
        };

        console.log("Route updated:", route.id);

        // -- DRIVER EMIT --
        driversNamespace.to(route.driverId!).emit("route:update", route);

        // -- BACKOFFICE EMIT --
        backofficeNamespace.emit("route:update", route);
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "routes" },
      async (payload) => {
        const newRoute = payload.new as SelectRoute;

        const routesRecord = await db.query.routes.findFirst({
          where: and(eq(routes.id, newRoute.id)),
          with: {
            shipment: {
              with: {
                items: true,
              },
            },
            location: true,
            recipient: {
              with: {
                businessInfo: true,
              },
            },
          },
        });

        const shipment = routesRecord?.shipment;
        const status = determineStatus(shipment as unknown as SelectShipment);

        const route = {
          ...routesRecord,
          shipment: {
            ...shipment,
            status,
          },
        };

        console.log("Route updated:", route.id);

        // -- DRIVER EMIT --
        driversNamespace.emit("route:update", route);

        // -- BACKOFFICE EMIT --
        backofficeNamespace.emit("route:update", route);
      }
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "driver_position" },
      async (payload) => {
        const driverPosition = keysToCamel(payload.new) as SelectDriverPosition;

        console.log("Driver position updated:", driverPosition);

        // -- BACKOFFICE EMIT --
        backofficeNamespace.emit("driver:update", driverPosition);
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "driver_position" },
      async (payload) => {
        const driverPosition = keysToCamel(payload.new) as SelectDriverPosition;

        console.log("Driver position updated:", driverPosition);

        // -- BACKOFFICE EMIT --
        backofficeNamespace.emit("driver:update", driverPosition);
      }
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "chat_messages" },
      async (payload) => {
        const message = keysToCamel(payload.new);

        console.log(
          "New chat_messages sent to backoffice for shipment: ",
          message.shipmentId
        );

        backofficeNamespace.emit("chat:update", message);
      }
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "rooms" },
      async (payload) => {
        const message = keysToCamel(payload.new);

        console.log(
          "New room sent to backoffice for shipment: ",
          message.shipmentId
        );

        backofficeNamespace.emit("rooms:update", message);
      }
    )
    .subscribe();

  const seamstressNamespace = io.of("/updates");
  seamstressNamespace.use(checkAuthed);

  seamstressNamespace.on("connection", async (socket) => {
    const seamstress = await db.query.seamstressToUsers.findFirst({
      where: eq(seamstressToUsers.userId, socket.user!.userId),
    });

    if (seamstress) {
      console.log("User connected as seamstress:", seamstress.seamstressId);
      // Join a room named after the seamstress ID
      socket.join(seamstress.seamstressId);
    } else {
      socket.disconnect();
    }

    socket.on("disconnect", () => {
      console.log("Seamstress user disconnected:", socket.user?.userId);
    });
  });

  const driversNamespace = io.of("/driver-updates");
  driversNamespace.use(checkAuthed);

  driversNamespace.on("connection", async (socket) => {
    console.log("User connected as driver:", socket.user!.userId);

    socket.join(socket.user!.userId);

    socket.on("disconnect", () => {
      console.log("Driver user disconnected:", socket.user?.userId);
    });
  });

  // 3) BACKOFFICE NAMESPACE (/backoffice-updates)
  const backofficeNamespace = io.of("/backoffice-updates");
  backofficeNamespace.use(checkAuthedBackoffice);

  backofficeNamespace.on("connection", (socket) => {
    console.log("User connected as backoffice:", socket.user?.userId);

    socket.on("disconnect", () => {
      console.log("Backoffice user disconnected:", socket.user?.userId);
    });
  });
};
