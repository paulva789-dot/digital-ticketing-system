import { Request, Response } from "express";
import { prisma } from "../config/prisma";
import { HttpError } from "../middleware/errorHandler";
import * as ticketService from "../services/ticket.service";
import { getPositionInQueue } from "../services/queue.service";

export async function createTicket(req: Request, res: Response) {
  const { serviceId, channel, contactEmail, contactPhone, quantity, seatType, paymentPlan, installments, scheduledAt } =
    req.body;
  const result = await ticketService.createTicket({
    serviceId,
    channel,
    contactEmail,
    contactPhone,
    quantity,
    seatType,
    paymentPlan,
    installments,
    scheduledAt,
    userId: req.customer?.id,
  });
  res.status(201).json(result);
}

export async function getTicket(req: Request, res: Response) {
  const ticket = await ticketService.getTicket(req.params.id);
  const position = await getPositionInQueue(ticket.id);
  res.json({ ...ticket, position });
}

export async function callNext(req: Request, res: Response) {
  const ticket = await ticketService.callNextTicket(req.params.serviceId);
  res.json(ticket);
}

export async function updateStatus(req: Request, res: Response) {
  const ticket = await ticketService.updateTicketStatus(req.params.id, req.body.status);
  res.json(ticket);
}

export async function cancel(req: Request, res: Response) {
  const ticket = await ticketService.cancelTicket(req.params.id, req.customer?.id);
  res.json(ticket);
}

export async function reschedule(req: Request, res: Response) {
  const ticket = await ticketService.rescheduleTicket(req.params.id, req.body.scheduledAt, req.customer?.id);
  res.json(ticket);
}

export async function payInstallment(req: Request, res: Response) {
  const ticket = await ticketService.payInstallment(req.params.id, req.body.amount);
  res.json(ticket);
}

export async function getDocument(req: Request, res: Response) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
    include: { service: true, user: true },
  });
  if (!ticket) throw new HttpError(404, "Ticket not found");

  const balance = (ticket.totalPrice - ticket.amountPaid).toFixed(2);
  const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><title>Ticket #${ticket.number}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #0f172a; }
  .card { border: 2px solid #0f172a; border-radius: 12px; padding: 24px; max-width: 480px; }
  h1 { margin: 0 0 4px; }
  .muted { color: #64748b; font-size: 14px; }
  table { width: 100%; margin-top: 16px; border-collapse: collapse; }
  td { padding: 6px 0; }
  td:last-child { text-align: right; font-weight: 600; }
</style>
</head>
<body>
  <div class="card">
    <h1>${ticket.service.name}</h1>
    <p class="muted">Ticket #${ticket.number} &middot; ${ticket.seatType.replace("_", " ")}</p>
    <table>
      <tr><td>Holder</td><td>${ticket.user?.name ?? ticket.user?.email ?? "Guest"}</td></tr>
      <tr><td>Quantity</td><td>${ticket.quantity}</td></tr>
      <tr><td>Discount</td><td>${ticket.discountPct}%</td></tr>
      <tr><td>Total price</td><td>$${ticket.totalPrice.toFixed(2)}</td></tr>
      <tr><td>Payment plan</td><td>${ticket.paymentPlan === "INSTALLMENT" ? "Installments" : "Paid in full"}</td></tr>
      <tr><td>Amount paid</td><td>$${ticket.amountPaid.toFixed(2)}</td></tr>
      ${ticket.paymentPlan === "INSTALLMENT" ? `<tr><td>Balance due</td><td>$${balance}</td></tr>` : ""}
      <tr><td>Status</td><td>${ticket.status}</td></tr>
    </table>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.setHeader("Content-Disposition", `inline; filename="ticket-${ticket.number}.html"`);
  res.send(html);
}
