import { serve } from "@hono/node-server";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { rolesRouter } from "@/routers/roles";
import errorHandler from "@/error-handling";
import { env } from "@/config/env";
import { showRoutes } from "hono/dev";
import { secureHeaders } from "hono/secure-headers";
import { timing } from "hono/timing";
import { authRouter } from "@/routers/auth";
import { usersRouter } from "@/routers/users";
import { shipmentRouter } from "@/routers/shipments";
import { userRouter } from "@/routers/user";
import { setupSocketIO } from "./websocket";
import { serveStatic } from "@hono/node-server/serve-static";
import { chatRoomsRouter } from "@/routers/chat-rooms";
import { seamstressRouter } from "@/routers/seamstress";
import { productsRouter } from "@/routers/products";
import { ordersRouter } from "@/routers/orders";
import { routesRouter } from "@/routers/routes";
import { driverRouter } from "@/routers/driver";
import { driversRoutes } from "@/routers/drivers";
import shipmentImportsRouter from "@/routers/shipment-imports";
import syncShipments from "../schedules/sync-shipments";
import { db } from "./db";
import { desc } from "drizzle-orm";
import { shipmentImports } from "./db/schemas/shipment-imports";
import cleanNoMessageChatRooms from "schedules/clean-no-message-chat-rooms";

const app = new Hono();

app
  .use(timing())
  .use(logger())
  .use(
    "*",
    cors({
      origin: "*",
    })
  )
  // .use("*", csrf());
  .use(secureHeaders());

console.log(`Server is running on http://0.0.0.0:${env.PORT}`);

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
});

const io = setupSocketIO(app);
io.attach(server);

app.use(serveStatic({ root: "public" }));

app.get("/", (c) => c.text("Welcome to our API"));

app
  .route("/api/auth", authRouter)
  .route("/api/shipments", shipmentRouter)
  .route("/api/products", productsRouter)
  .route("/api/seamstress", seamstressRouter)
  .route("/api/users", usersRouter)
  .route("/api/user", userRouter)
  .route("/api/driver", driverRouter)
  .route("/api/orders", ordersRouter)
  .route("/api/roles", rolesRouter)
  .route("/api/routes", routesRouter)
  .route("/api/drivers", driversRoutes)
  .route("/api/chat-rooms", chatRoomsRouter)
  .route("/api/shipment-imports", shipmentImportsRouter)
  .onError(errorHandler);

showRoutes(app);

setInterval(async () => {
  const lastSync = await db
    .select()
    .from(shipmentImports)
    .orderBy(desc(shipmentImports.createdAt))
    .limit(1);

  if (lastSync[0].createdAt <= new Date(Date.now() - 1000 * 60 * 60)) {
    syncShipments();
  }

  cleanNoMessageChatRooms();
}, 1000 * 60 * 60);

syncShipments();
cleanNoMessageChatRooms();
