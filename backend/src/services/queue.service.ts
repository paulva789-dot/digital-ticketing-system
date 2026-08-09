import { prisma } from "../config/prisma";

export interface QueueStatus {
  serviceId: string;
  waitingCount: number;
  nowServing: number | null;
  estimatedWaitMin: number;
}

/** Current snapshot of a service's queue, used both by the REST endpoint and socket broadcasts. */
export async function getQueueStatus(serviceId: string): Promise<QueueStatus> {
  const service = await prisma.service.findUniqueOrThrow({ where: { id: serviceId } });

  const [waitingCount, serving] = await Promise.all([
    prisma.ticket.count({ where: { serviceId, status: "WAITING" } }),
    prisma.ticket.findFirst({
      where: { serviceId, status: "SERVING" },
      orderBy: { servingAt: "desc" },
    }),
  ]);

  return {
    serviceId,
    waitingCount,
    nowServing: serving?.number ?? null,
    estimatedWaitMin: waitingCount * service.avgServiceTimeMin,
  };
}

/** How many tickets are still ahead of this one in the WAITING queue. */
export async function getPositionInQueue(ticketId: string): Promise<number> {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  if (ticket.status !== "WAITING") return 0;

  return prisma.ticket.count({
    where: {
      serviceId: ticket.serviceId,
      status: "WAITING",
      createdAt: { lt: ticket.createdAt },
    },
  });
}
