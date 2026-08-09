import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";

export async function getMe(req: Request, res: Response) {
  if (!req.customer) throw new HttpError(401, "Not signed in");
  const user = await prisma.user.findUnique({ where: { id: req.customer.id } });
  if (!user) throw new HttpError(404, "User not found");
  res.json(user);
}

/** Demo self-service upgrade — a real app would gate this behind a payment/subscription flow. */
export async function setPremium(req: Request, res: Response) {
  if (!req.customer) throw new HttpError(401, "Not signed in");
  const user = await prisma.user.update({
    where: { id: req.customer.id },
    data: { isPremium: Boolean(req.body.isPremium) },
  });
  res.json(user);
}

export async function setLocale(req: Request, res: Response) {
  if (!req.customer) throw new HttpError(401, "Not signed in");
  const user = await prisma.user.update({
    where: { id: req.customer.id },
    data: { locale: req.body.locale },
  });
  res.json(user);
}

export async function getMyTickets(req: Request, res: Response) {
  if (!req.customer) throw new HttpError(401, "Not signed in");
  const tickets = await prisma.ticket.findMany({
    where: { userId: req.customer.id },
    include: { service: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(tickets);
}
