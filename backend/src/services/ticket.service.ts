import { PaymentPlan, SeatType, TicketChannel, TicketStatus } from "@prisma/client";
import { isCaptchaConfigured, verifyCaptcha } from "./captcha.service";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";
import { emitQueueUpdate, emitTicketCalled } from "../sockets";
import { generateTicketQrCode } from "../utils/qrcode";
import { notifyTicketAlmostUp, notifyTicketCreated, sendTextMessage } from "./notification.service";
import { sendEmail } from "./email.service";
import { getQueueStatus } from "./queue.service";

interface CreateTicketInput {
  serviceId: string;
  userId?: string;
  channel: TicketChannel;
  contactEmail?: string;
  contactPhone?: string;
  quantity: number;
  seatType: SeatType;
  paymentPlan: PaymentPlan;
  installments: number;
  scheduledAt?: Date;
  captchaToken?: string;
  requestIp?: string;
}

/** Front-row drops are exactly what scalper bots target — gate the last 20% (min 3 seats) behind a captcha. */
export function isFrontRowLowStock(frontRowStock: number, frontRowSold: number): boolean {
  const remaining = frontRowStock - frontRowSold;
  return remaining <= Math.max(3, Math.ceil(frontRowStock * 0.2));
}

/** 10% off orders of 2+ tickets, 20% off orders of 5+ — encourages group bookings. */
export function discountPctForQuantity(quantity: number): number {
  if (quantity >= 5) return 20;
  if (quantity >= 2) return 10;
  return 0;
}

/**
 * Checks the rules that don't need a database lock (release window, per-order cap).
 * Stock itself is enforced separately by an atomic conditional UPDATE inside the
 * booking transaction — checking `frontRowSold` here first is just a fast-fail;
 * it is NOT what prevents overselling under concurrent requests.
 */
function assertFrontRowRules(
  service: { frontRowStock: number; frontRowSold: number; frontRowReleaseAt: Date; frontRowWindowDays: number },
  quantity: number,
  isPremium: boolean
) {
  const remaining = service.frontRowStock - service.frontRowSold;
  if (remaining < quantity) {
    throw new HttpError(409, "Not enough front-row tickets left");
  }

  if (isPremium) return; // Premium: book any time, no per-order cap, while stock lasts.

  const windowCloses = new Date(
    service.frontRowReleaseAt.getTime() + service.frontRowWindowDays * 24 * 60 * 60 * 1000
  );
  const now = new Date();
  if (now < service.frontRowReleaseAt || now > windowCloses) {
    throw new HttpError(
      403,
      `Front-row tickets for free accounts are only bookable within ${service.frontRowWindowDays} days of release. Upgrade to premium for anytime access.`
    );
  }
  if (quantity > 1) {
    throw new HttpError(403, "Free accounts are limited to 1 front-row ticket per order. Upgrade to premium for more.");
  }
}

export async function createTicket(input: CreateTicketInput) {
  const service = await prisma.service.findUnique({ where: { id: input.serviceId } });
  if (!service || !service.active) {
    throw new HttpError(404, "Service not found or inactive");
  }

  const user = input.userId ? await prisma.user.findUnique({ where: { id: input.userId } }) : null;
  const isPremium = user?.isPremium ?? false;

  if (input.seatType === "FRONT_ROW") {
    assertFrontRowRules(service, input.quantity, isPremium);

    if (isCaptchaConfigured && isFrontRowLowStock(service.frontRowStock, service.frontRowSold)) {
      const verified = await verifyCaptcha(input.captchaToken, input.requestIp);
      if (!verified) {
        throw new HttpError(403, "Please complete the verification challenge and try again.");
      }
    }
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

  const unitPrice = service.price + (input.seatType === "FRONT_ROW" ? service.frontRowSurcharge : 0);
  const discountPct = discountPctForQuantity(input.quantity);
  const totalPrice = Math.round(unitPrice * input.quantity * (1 - discountPct / 100) * 100) / 100;

  const ticket = await prisma.$transaction(async (tx) => {
    if (input.seatType === "FRONT_ROW") {
      // Single atomic UPDATE: only succeeds if there's still enough stock, so two
      // concurrent bookings can never both succeed and oversell the last seats.
      const claimed = await tx.$executeRaw`
        UPDATE "Service"
        SET "frontRowSold" = "frontRowSold" + ${input.quantity}
        WHERE id = ${input.serviceId} AND "frontRowSold" + ${input.quantity} <= "frontRowStock"
      `;
      if (claimed === 0) throw new HttpError(409, "Not enough front-row tickets left");
    }

    // Same pattern for ticket numbers: an atomic increment-and-return instead of a
    // separate "find max, then insert max+1" that two concurrent requests could race.
    const [{ nextTicketNumber }] = await tx.$queryRaw<{ nextTicketNumber: number }[]>`
      UPDATE "Service"
      SET "nextTicketNumber" = "nextTicketNumber" + 1
      WHERE id = ${input.serviceId}
      RETURNING "nextTicketNumber"
    `;

    return tx.ticket.create({
      data: {
        serviceId: input.serviceId,
        userId: input.userId,
        channel: input.channel,
        number: nextTicketNumber - 1,
        seatType: input.seatType,
        quantity: input.quantity,
        unitPrice,
        discountPct,
        totalPrice,
        paymentPlan: input.paymentPlan,
        installments: input.paymentPlan === "INSTALLMENT" ? input.installments : 1,
        amountPaid: 0,
        scheduledAt: input.scheduledAt,
      },
    });
  });

  const qrCode = await generateTicketQrCode(ticket.id);

  await notifyTicketCreated({
    email: input.contactEmail ?? user?.email,
    phone: input.contactPhone ?? user?.phone,
    serviceName: service.name,
    ticketNumber: ticket.number,
    quantity: ticket.quantity,
    seatType: ticket.seatType,
    totalPrice: ticket.totalPrice,
    discountPct: ticket.discountPct,
    paymentPlan: ticket.paymentPlan,
    amountPaid: ticket.amountPaid,
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

const CANCELLABLE_STATUSES: TicketStatus[] = ["WAITING", "CALLED"];

/**
 * Customer-initiated cancellation. Releases any front-row seats it held back to
 * stock and refunds any money collected so far (marks SUCCESS payments REFUNDED
 * and zeroes the ticket's amountPaid — this scaffold has no real payout step, so
 * "refund" here means "stop counting it as collected"; wire actual provider
 * refund API calls in here once real credentials are configured).
 *
 * A guest (no userId) ticket can be cancelled by anyone holding its id, same as
 * `getTicket` — the id itself is the guest's credential. A ticket owned by a
 * signed-in user can only be cancelled by that same user.
 */
export async function cancelTicket(ticketId: string, requesterId?: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { user: true } });
  if (!ticket) throw new HttpError(404, "Ticket not found");
  if (ticket.userId && ticket.userId !== requesterId) {
    throw new HttpError(403, "You can only cancel your own tickets");
  }
  if (!CANCELLABLE_STATUSES.includes(ticket.status)) {
    throw new HttpError(400, `Cannot cancel a ticket that is already ${ticket.status.toLowerCase()}`);
  }

  const refundedAmount = ticket.amountPaid;

  const updated = await prisma.$transaction(async (tx) => {
    if (ticket.seatType === "FRONT_ROW") {
      await tx.service.update({
        where: { id: ticket.serviceId },
        data: { frontRowSold: { decrement: ticket.quantity } },
      });
    }

    if (refundedAmount > 0) {
      await tx.payment.updateMany({
        where: { ticketId, status: "SUCCESS" },
        data: { status: "REFUNDED" },
      });
    }

    return tx.ticket.update({
      where: { id: ticketId },
      data: { status: "CANCELLED", amountPaid: 0 },
    });
  });

  const message =
    refundedAmount > 0
      ? `Your ticket #${ticket.number} has been cancelled and your payment of $${refundedAmount.toFixed(2)} has been refunded.`
      : `Your ticket #${ticket.number} has been cancelled.`;
  await Promise.allSettled([
    ticket.user?.email ? sendEmail(ticket.user.email, "Ticket cancelled", message) : Promise.resolve(),
    ticket.user?.phone ? sendTextMessage(ticket.user.phone, message) : Promise.resolve(),
  ]);

  emitQueueUpdate(updated.serviceId, await getQueueStatus(updated.serviceId));
  return updated;
}

const RESCHEDULABLE_STATUSES: TicketStatus[] = ["WAITING"];

/**
 * Moves an appointment's scheduled time. Only allowed while the ticket is still WAITING.
 * Same ownership rule as `cancelTicket`: guest tickets are movable by anyone holding the
 * id, tickets owned by a signed-in user only by that user.
 */
export async function rescheduleTicket(ticketId: string, scheduledAt: Date, requesterId?: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId }, include: { service: true, user: true } });
  if (!ticket) throw new HttpError(404, "Ticket not found");
  if (ticket.userId && ticket.userId !== requesterId) {
    throw new HttpError(403, "You can only reschedule your own tickets");
  }
  if (!RESCHEDULABLE_STATUSES.includes(ticket.status)) {
    throw new HttpError(400, `Cannot reschedule a ticket that is already ${ticket.status.toLowerCase()}`);
  }
  if (scheduledAt.getTime() < Date.now()) {
    throw new HttpError(400, "New appointment time must be in the future");
  }

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { scheduledAt, rescheduleCount: { increment: 1 }, reminderSentAt: null },
  });

  const message = `Your appointment for ${ticket.service.name} (ticket #${ticket.number}) has been rescheduled to ${scheduledAt.toLocaleString()}.`;
  await Promise.allSettled([
    ticket.user?.email ? sendEmail(ticket.user.email, "Appointment rescheduled", message) : Promise.resolve(),
    ticket.user?.phone ? sendTextMessage(ticket.user.phone, message) : Promise.resolve(),
  ]);

  return updated;
}

/**
 * Scans for appointments starting within the next 24h that haven't had a reminder sent yet,
 * and notifies their owners. Intended to be run on an interval (see index.ts).
 */
export async function sendUpcomingReminders() {
  const windowEnd = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const due = await prisma.ticket.findMany({
    where: {
      scheduledAt: { gte: new Date(), lte: windowEnd },
      reminderSentAt: null,
      status: "WAITING",
    },
    include: { service: true, user: true },
  });

  for (const ticket of due) {
    const message = `Reminder: your appointment for ${ticket.service.name} (ticket #${ticket.number}) is coming up on ${ticket.scheduledAt!.toLocaleString()}.`;
    await notifyTicketAlmostUp({
      email: ticket.user?.email,
      phone: ticket.user?.phone,
      serviceName: ticket.service.name,
      ticketNumber: ticket.number,
    }).catch(() => {});
    const { sendEmail } = await import("./email.service");
    await (ticket.user?.email ? sendEmail(ticket.user.email, "Appointment reminder", message) : Promise.resolve());
    await prisma.ticket.update({ where: { id: ticket.id }, data: { reminderSentAt: new Date() } });
  }

  return due.length;
}

/** Records an installment payment against a ticket booked on the INSTALLMENT plan. */
export async function payInstallment(ticketId: string, amount: number) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new HttpError(404, "Ticket not found");
  if (ticket.paymentPlan !== "INSTALLMENT") {
    throw new HttpError(400, "This ticket is not on an installment plan");
  }
  const balance = ticket.totalPrice - ticket.amountPaid;
  if (balance <= 0) throw new HttpError(400, "This ticket is already fully paid");
  if (amount > balance + 0.01) throw new HttpError(400, `Amount exceeds remaining balance of ${balance.toFixed(2)}`);

  return prisma.ticket.update({
    where: { id: ticketId },
    data: { amountPaid: { increment: amount } },
  });
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
