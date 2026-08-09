import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";
import { signStaffToken } from "../utils/jwt";

export async function registerStaff(req: Request, res: Response) {
  const { email, password, name, role } = req.body;

  const existing = await prisma.staffUser.findUnique({ where: { email } });
  if (existing) throw new HttpError(409, "Email already registered");

  const passwordHash = await bcrypt.hash(password, 12);
  const staff = await prisma.staffUser.create({
    data: { email, passwordHash, name, role },
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
