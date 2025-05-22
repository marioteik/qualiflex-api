import { Server } from "socket.io";
import type { Context, Hono, Next } from "hono";
import { updatesChannel } from "@/websocket/updates";
import { chatChannel } from "@/websocket/chat";

export const setupSocketIO = (app: Hono) => {
  const io = new Server({
    cors: {
      origin: "*",
    },
  });

  io.on("error", (err) => {
    console.log(err);
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("message", (data) => {
      console.log("Message received:", data);
      io.emit("message", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  updatesChannel(io);
  chatChannel(io);

  app.use(async (c: Context, next: Next) => {
    c.set("io", io);
    await next();
  });

  return io;
};
