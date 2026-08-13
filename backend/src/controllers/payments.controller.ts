import { PaymentProvider } from "@prisma/client";
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

export async function webhook(req: Request, res: Response) {
  const provider = req.params.provider.toUpperCase() as PaymentProvider;
  const payment = await paymentService.handleProviderWebhook(provider, req.body);
  res.json({ received: true, paymentId: payment.id, status: payment.status });
}
