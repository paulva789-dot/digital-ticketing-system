import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function ticketsPerService(_req: Request, res: Response) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const services = await prisma.service.findMany({ where: { active: true } });

  const stats = await Promise.all(
    services.map(async (service) => {
      const [completedToday, waiting] = await Promise.all([
        prisma.ticket.count({
          where: { serviceId: service.id, status: "COMPLETED", completedAt: { gte: startOfDay } },
        }),
        prisma.ticket.count({ where: { serviceId: service.id, status: "WAITING" } }),
      ]);
      return { serviceId: service.id, serviceName: service.name, completedToday, waiting };
    })
  );

  res.json(stats);
}
