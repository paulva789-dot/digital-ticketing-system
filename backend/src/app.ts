import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { analyticsRouter } from "./routes/analytics.routes";
import { authRouter } from "./routes/auth.routes";
import { paymentsRouter } from "./routes/payments.routes";
import { queueRouter } from "./routes/queue.routes";
import { securityApplicationsRouter } from "./routes/securityApplications.routes";
import { servicesRouter } from "./routes/services.routes";
import { ticketsRouter } from "./routes/tickets.routes";
import { usersRouter } from "./routes/users.routes";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Raw request bytes, captured for webhook signature verification (see payments webhook route). */
      rawBody?: Buffer;
    }
  }
}

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as express.Request).rawBody = buf;
    },
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/services", servicesRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/queue", queueRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/users", usersRouter);
app.use("/api/security-applications", securityApplicationsRouter);
app.use("/api/payments", paymentsRouter);

app.use(errorHandler);
