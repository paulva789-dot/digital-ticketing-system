import { createServer } from "http";
import { app } from "./app";
import { env } from "./config/env";
import { initSockets } from "./sockets";
import { sendUpcomingReminders } from "./services/ticket.service";

const httpServer = createServer(app);
initSockets(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Ticketing API listening on http://localhost:${env.port}`);
});

// Scans for appointments starting in the next 24h and sends reminders once per ticket.
const REMINDER_INTERVAL_MS = 15 * 60 * 1000;
setInterval(() => {
  sendUpcomingReminders().catch((err) => console.error("Reminder scan failed:", err));
}, REMINDER_INTERVAL_MS);
