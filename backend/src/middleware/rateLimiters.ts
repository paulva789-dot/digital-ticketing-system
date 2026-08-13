import rateLimit from "express-rate-limit";

/**
 * Tighter limit specifically for ticket creation. The app-wide limiter (300 req/15min)
 * is loose enough that a scalper bot could still hammer a front-row drop through it —
 * this caps actual booking attempts much harder, on top of the global one.
 */
export const ticketCreationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many booking attempts from this connection — please wait a few minutes and try again." },
});
