import { z } from "zod";

export const staffLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const staffRegisterSchema = staffLoginSchema.extend({
  name: z.string().min(2),
  role: z.enum(["STAFF", "ADMIN"]).default("STAFF"),
});
