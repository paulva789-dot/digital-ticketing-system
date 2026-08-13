import { prisma } from "../config/prisma";

export interface QueueStatus {
  serviceId: string;
  serviceName: string;
  waitingCount: number;
  nowServing: number | null;
  /** Next few ticket numbers still WAITING, in call order — for display boards / kiosk views. */
  upNext: number[];
  estimatedWaitMin: number;
}

const UP_NEXT_COUNT = 5;

/** Current snapshot of a service's queue, used both by the REST endpoint and socket broadcasts. */
export async function getQueueStatus(serviceId: string): Promise<QueueStatus> {
  const service = await prisma.service.findUniqueOrThrow({ where: { id: serviceId } });

  const [waitingCount, serving, upNextTickets] = await Promise.all([
    prisma.ticket.count({ where: { serviceId, status: "WAITING" } }),
    // "Now serving" means the most recently called ticket that hasn't finished yet.
    // Staff commonly go straight from CALLED to COMPLETED without an explicit SERVING
    // step, so this has to include CALLED too or the display board would sit empty.
    prisma.ticket.findFirst({
      where: { serviceId, status: { in: ["CALLED", "SERVING"] } },
      orderBy: { calledAt: "desc" },
    }),
    prisma.ticket.findMany({
      where: { serviceId, status: "WAITING" },
      orderBy: { createdAt: "asc" },
      take: UP_NEXT_COUNT,
      select: { number: true },
    }),
  ]);

  return {
    serviceId,
    serviceName: service.name,
    waitingCount,
    nowServing: serving?.number ?? null,
    upNext: upNextTickets.map((t) => t.number),
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
