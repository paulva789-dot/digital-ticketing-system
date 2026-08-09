import { Server as HttpServer } from "http";
import { Server as SocketIoServer } from "socket.io";
import { env } from "../config/env";

let io: SocketIoServer | null = null;

export function initSockets(httpServer: HttpServer): SocketIoServer {
  io = new SocketIoServer(httpServer, {
    cors: { origin: env.corsOrigin },
  });

  io.on("connection", (socket) => {
    socket.on("queue:subscribe", (serviceId: string) => {
      socket.join(`service:${serviceId}`);
    });
    socket.on("queue:unsubscribe", (serviceId: string) => {
      socket.leave(`service:${serviceId}`);
    });
  });

  return io;
}

/** Broadcasts a queue change to everyone watching this service. */
export function emitQueueUpdate(serviceId: string, payload: unknown): void {
  io?.to(`service:${serviceId}`).emit("queue:update", payload);
}

/** Notifies everyone watching this service that a specific ticket was called. */
export function emitTicketCalled(serviceId: string, payload: unknown): void {
  io?.to(`service:${serviceId}`).emit("ticket:called", payload);
}
