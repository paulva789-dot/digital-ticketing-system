import { Request, Response } from "express";
import * as paymentService from "../services/payment.service";

export async function initiate(req: Request, res: Response) {
  const { ticketId, provider } = req.body;
  const result = await paymentService.initiatePayment(ticketId, provider, req.customer?.id);
  res.status(201).json(result);
}

export async function confirm(req: Request, res: Response) {
  const payment = await paymentService.confirmSandboxPayment(req.params.id);
  res.json(payment);
}
