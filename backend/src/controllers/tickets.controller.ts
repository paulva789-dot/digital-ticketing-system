import { Request, Response } from "express";
import * as ticketService from "../services/ticket.service";
import { getPositionInQueue } from "../services/queue.service";

export async function createTicket(req: Request, res: Response) {
  const { serviceId, channel, contactEmail, contactPhone } = req.body;
  const result = await ticketService.createTicket({
    serviceId,
    channel,
    contactEmail,
    contactPhone,
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
