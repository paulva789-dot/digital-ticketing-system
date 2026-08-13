import { z } from "zod";

export const createTicketSchema = z.object({
  serviceId: z.string().uuid(),
  channel: z.enum(["WEB", "APP", "KIOSK"]).default("WEB"),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(6).optional(),
  quantity: z.number().int().min(1).max(10).default(1),
  seatType: z.enum(["STANDARD", "FRONT_ROW"]).default("STANDARD"),
  paymentPlan: z.enum(["FULL", "INSTALLMENT"]).default("FULL"),
  installments: z.number().int().min(1).max(6).default(1),
  scheduledAt: z.coerce.date().optional(),
  /** Cloudflare Turnstile token — required for front-row bookings once stock is low, if configured. */
  captchaToken: z.string().optional(),
});

export const rescheduleTicketSchema = z.object({
  scheduledAt: z.coerce.date(),
});

export const initiatePaymentSchema = z.object({
  ticketId: z.string().uuid(),
  provider: z.enum(["MTN_MOMO", "ORANGE_MONEY", "STRIPE", "FLUTTERWAVE", "FREE_TRIAL"]),
});

export const paymentWebhookSchema = z.object({
  reference: z.string(),
  status: z.enum(["SUCCESS", "FAILED"]),
});

export const updateLocaleSchema = z.object({
  locale: z.enum(["en", "fr"]),
});

export const createServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  avgServiceTimeMin: z.number().int().positive().default(5),
  price: z.number().min(0).default(0),
  frontRowSurcharge: z.number().min(0).default(0),
  frontRowStock: z.number().int().min(0).default(0),
  frontRowReleaseAt: z.coerce.date().optional(),
  frontRowWindowDays: z.number().int().min(1).max(30).default(3),
});

export const updateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  avgServiceTimeMin: z.number().int().positive().optional(),
  price: z.number().min(0).optional(),
  frontRowSurcharge: z.number().min(0).optional(),
  frontRowStock: z.number().int().min(0).optional(),
  frontRowReleaseAt: z.coerce.date().optional(),
  frontRowWindowDays: z.number().int().min(1).max(30).optional(),
  active: z.boolean().optional(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["WAITING", "CALLED", "SERVING", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});

export const payInstallmentSchema = z.object({
  amount: z.number().positive(),
});

export const securityApplicationSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  experience: z.string().max(2000).optional(),
  message: z.string().max(2000).optional(),
});
