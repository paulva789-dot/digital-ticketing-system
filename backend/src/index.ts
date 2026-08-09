import { createServer } from "http";
import { app } from "./app";
import { env } from "./config/env";
import { initSockets } from "./sockets";

const httpServer = createServer(app);
initSockets(httpServer);

httpServer.listen(env.port, () => {
  console.log(`Ticketing API listening on http://localhost:${env.port}`);
});
