import { TicketChannel, TicketStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";
import { emitQueueUpdate, emitTicketCalled } from "../sockets";
import { generateTicketQrCode } from "../utils/qrcode";
import { notifyTicketAlmostUp, notifyTicketCreated } from "./notification.service";
import { getQueueStatus } from "./queue.service";

interface CreateTicketInput {
  serviceId: string;
  userId?: string;
  channel: TicketChannel;
  contactEmail?: string;
  contactPhone?: string;
}

export async function createTicket(input: CreateTicketInput) {
  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service || !service.active) {
    throw new HttpError(404, "Service not found or inactive");
  }

  if (input.userId && (input.contactEmail || input.contactPhone)) {
    await prisma.user.update({
      where: { id: input.userId },
      data: {
        ...(input.contactEmail ? { email: input.contactEmail } : {}),
        ...(input.contactPhone ? { phone: input.contactPhone } : {}),
      },
    });
  }

  const ticket = await prisma.$transaction(async (tx) => {
    const last = await tx.ticket.findFirst({
      where: { serviceId: input.serviceId },
      orderBy: { number: "desc" },
    });
    return tx.ticket.create({
      data: {
        serviceId: input.serviceId,
        userId: input.userId,
        channel: input.channel,
        number: (last?.number ?? 0) + 1,
      },
    });
  });

  const qrCode = await generateTicketQrCode(ticket.id);

  await notifyTicketCreated({
    email: input.contactEmail,
    phone: input.contactPhone,
    serviceName: service.name,
    ticketNumber: ticket.number,
  });

  emitQueueUpdate(service.id, await getQueueStatus(service.id));

  return { ticket, qrCode };
}

export async function getTicket(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { service: true, user: true },
  });
  if (!ticket) throw new HttpError(404, "Ticket not found");
  return ticket;
}

/** Staff action: pulls the next WAITING ticket for a service into CALLED state. */
export async function callNextTicket(serviceId: string) {
  const next = await prisma.ticket.findFirst({
    where: { serviceId, status: "WAITING" },
    orderBy: { createdAt: "asc" },
    include: { user: true, service: true },
  });
  if (!next) throw new HttpError(404, "No tickets waiting for this service");

  const updated = await prisma.ticket.update({
    where: { id: next.id },
    data: { status: "CALLED", calledAt: new Date() },
  });

  await notifyTicketAlmostUp({
    email: next.user?.email,
    phone: next.user?.phone,
    serviceName: next.service.name,
    ticketNumber: next.number,
  });

  emitTicketCalled(serviceId, { ticketId: updated.id, number: updated.number });
  emitQueueUpdate(serviceId, await getQueueStatus(serviceId));

  return updated;
}

export async function updateTicketStatus(ticketId: string, status: TicketStatus) {
  const timestampField =
    status === "SERVING" ? { servingAt: new Date() } : status === "COMPLETED" ? { completedAt: new Date() } : {};

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status, ...timestampField },
  });

  emitQueueUpdate(updated.serviceId, await getQueueStatus(updated.serviceId));
  return updated;
}
