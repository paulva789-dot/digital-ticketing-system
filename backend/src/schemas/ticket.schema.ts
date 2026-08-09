import { z } from "zod";

export const createTicketSchema = z.object({
  serviceId: z.string().uuid(),
  channel: z.enum(["WEB", "APP", "KIOSK"]).default("WEB"),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().min(6).optional(),
});

export const createServiceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  avgServiceTimeMin: z.number().int().positive().default(5),
});
