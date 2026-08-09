import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export interface StaffTokenPayload {
  sub: string;
  email: string;
  role: "STAFF" | "ADMIN";
}

export function signStaffToken(payload: StaffTokenPayload): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyStaffToken(token: string): StaffTokenPayload {
  return jwt.verify(token, env.jwtSecret) as StaffTokenPayload;
}
