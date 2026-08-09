import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { notifySecurityApplicationReceived } from "../services/notification.service";

export async function apply(req: Request, res: Response) {
  const { fullName, email, phone, experience, message } = req.body;

  const application = await prisma.securityApplication.create({
    data: { fullName, email, phone, experience, message },
  });

  await notifySecurityApplicationReceived({ email, fullName });

  res.status(201).json({
    application,
    reply: "Thank you for applying, we will reach out to you soon.",
  });
}

export async function listRecent(_req: Request, res: Response) {
  const applications = await prisma.securityApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  res.json(applications);
}
