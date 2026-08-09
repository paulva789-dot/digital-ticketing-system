import { NextFunction, Request, Response } from "express";
import { firebaseAdmin } from "../config/firebase";
import { prisma } from "../config/prisma";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      customer?: { id: string; firebaseUid: string };
    }
  }
}

/**
 * Verifies the Firebase ID token from the Authorization header and attaches
 * (creating if needed) the corresponding local User row to req.customer.
 */
export async function requireCustomer(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  if (!firebaseAdmin) {
    return res.status(503).json({ error: "Firebase authentication is not configured" });
  }

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: {},
      create: {
        firebaseUid: decoded.uid,
        email: decoded.email ?? null,
        name: (decoded.name as string | undefined) ?? null,
      },
    });
    req.customer = { id: user.id, firebaseUid: user.firebaseUid };
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/**
 * Attaches req.customer when a valid Firebase token is present, but allows the
 * request through regardless — for kiosk/anonymous bookings that skip login.
 */
export async function optionalCustomer(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token || !firebaseAdmin) return next();

  try {
    const decoded = await firebaseAdmin.auth().verifyIdToken(token);
    const user = await prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      update: {},
      create: {
        firebaseUid: decoded.uid,
        email: decoded.email ?? null,
        name: (decoded.name as string | undefined) ?? null,
      },
    });
    req.customer = { id: user.id, firebaseUid: user.firebaseUid };
  } catch {
    // Invalid token on an optional route just means "proceed unauthenticated".
  }
  next();
}
