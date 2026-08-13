import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";
import { signStaffToken, verifyStaffToken } from "../utils/jwt";

/**
 * Registration is open only to bootstrap the very first staff account (forced to
 * ADMIN so someone can administer the system). Once any StaffUser exists, creating
 * more requires a valid admin bearer token — otherwise this endpoint would let
 * anyone on the internet mint themselves an ADMIN account.
 */
export async function registerStaff(req: Request, res: Response) {
  const { email, password, name, role } = req.body;

  const existing = await prisma.staffUser.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, "Email already registered");

  const staffCount = await prisma.staffUser.count();
  let effectiveRole = role;

  if (staffCount === 0) {
    effectiveRole = "ADMIN";
  } else {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) throw new HttpError(401, "Sign in as an admin to create staff accounts");

    try {
      const payload = verifyStaffToken(token);
      if (payload.role !== "ADMIN") throw new HttpError(403, "Admin access required");
    } catch (err) {
      if (err instanceof HttpError) throw err;
      throw new HttpError(401, "Invalid or expired token");
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const staff = await prisma.staffUser.create({
    data: { email, passwordHash, name, role: effectiveRole },
  });

  const token = signStaffToken({ sub: staff.id, email: staff.email, role: staff.role });
  res.status(201).json({ token, staff: { id: staff.id, email: staff.email, name: staff.name, role: staff.role } });
}

export async function loginStaff(req: Request, res: Response) {
  const { email, password } = req.body;

  const staff = await prisma.staffUser.findUnique({ where: { email } });
  if (!staff) throw new HttpError(401, "Invalid credentials");

  const valid = await bcrypt.compare(password, staff.passwordHash);
  if (!valid) throw new HttpError(401, "Invalid credentials");

  const token = signStaffToken({ sub: staff.id, email: staff.email, role: staff.role });
  res.json({ token, staff: { id: staff.id, email: staff.email, name: staff.name, role: staff.role } });
}
