import { PaymentProvider } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { HttpError } from "../middleware/errorHandler";

interface InitiateResult {
  paymentId: string;
  reference: string;
  status: "PENDING" | "SUCCESS";
  provider: PaymentProvider;
  /** Sandbox instructions/redirect the frontend can show — not a real checkout URL yet. */
  instructions: string;
}

const SANDBOX_CONFIG: Record<Exclude<PaymentProvider, "FREE_TRIAL">, { configured: boolean; label: string }> = {
  MTN_MOMO: { configured: Boolean(env.payments.mtnMomo.apiKey), label: "MTN Mobile Money" },
  ORANGE_MONEY: { configured: Boolean(env.payments.orangeMoney.apiKey), label: "Orange Money" },
  STRIPE: { configured: Boolean(env.payments.stripe.secretKey), label: "Stripe" },
  FLUTTERWAVE: { configured: Boolean(env.payments.flutterwave.secretKey), label: "Flutterwave" },
};

/**
 * Every provider call below is a sandbox-mode stub: it records a PENDING payment and returns
 * instructions the UI can render, instead of calling the real provider API. Once real
 * credentials are set in .env, swap each branch for the provider's actual SDK/API call and
 * flip PENDING -> SUCCESS from their webhook instead of the manual /confirm endpoint.
 */
export async function initiatePayment(ticketId: string, provider: PaymentProvider, userId?: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new HttpError(404, "Ticket not found");

  const balance = Math.round((ticket.totalPrice - ticket.amountPaid) * 100) / 100;
  if (balance <= 0) throw new HttpError(400, "This ticket is already fully paid");

  if (provider === "FREE_TRIAL") {
    if (!userId) throw new HttpError(401, "Sign in to claim your free trial");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(404, "User not found");
    if (user.freeTrialUsed) throw new HttpError(409, "You've already used your free trial");

    const reference = `TRIAL-${randomUUID()}`;
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: { ticketId, provider, amount: balance, reference, status: "SUCCESS", confirmedAt: new Date() },
      }),
      prisma.user.update({ where: { id: userId }, data: { freeTrialUsed: true } }),
      prisma.ticket.update({ where: { id: ticketId }, data: { amountPaid: { increment: balance } } }),
    ]);

    return {
      paymentId: payment.id,
      reference,
      status: "SUCCESS",
      provider,
      instructions: "Your free trial covers this ticket in full — enjoy!",
    } satisfies InitiateResult;
  }

  const config = SANDBOX_CONFIG[provider];
  const reference = `${provider}-${randomUUID()}`;
  const payment = await prisma.payment.create({
    data: { ticketId, provider, amount: balance, reference, status: "PENDING" },
  });

  const instructions = config.configured
    ? `Redirecting you to ${config.label} to pay ${balance.toFixed(2)}...`
    : `[sandbox] ${config.label} isn't connected to real credentials yet. In production this would redirect to ${config.label} to collect ${balance.toFixed(
        2
      )}. Use the confirm step below to simulate a successful sandbox payment.`;

  return { paymentId: payment.id, reference, status: "PENDING", provider, instructions } satisfies InitiateResult;
}

/** Sandbox-only: simulates the provider's webhook telling us a PENDING payment succeeded. */
export async function confirmSandboxPayment(paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new HttpError(404, "Payment not found");
  if (payment.status !== "PENDING") throw new HttpError(400, "Payment is not pending");

  if (payment.provider !== "FREE_TRIAL" && SANDBOX_CONFIG[payment.provider].configured) {
    throw new HttpError(
      400,
      `${SANDBOX_CONFIG[payment.provider].label} is live — this payment is confirmed via its webhook, not the sandbox endpoint`
    );
  }

  const [updated] = await prisma.$transaction([
    prisma.payment.update({ where: { id: paymentId }, data: { status: "SUCCESS", confirmedAt: new Date() } }),
    prisma.ticket.update({ where: { id: payment.ticketId }, data: { amountPaid: { increment: payment.amount } } }),
  ]);

  return updated;
}

interface WebhookEvent {
  /** Our own internal Payment.reference, passed to the provider at checkout time as the order/metadata id. */
  reference: string;
  status: "SUCCESS" | "FAILED";
}

/**
 * Applies a verified provider webhook event to the matching PENDING payment.
 * Idempotent: replaying the same event for an already-resolved payment is a no-op
 * that just returns its current state, since providers commonly retry webhooks.
 */
export async function handleProviderWebhook(provider: PaymentProvider, event: WebhookEvent) {
  const payment = await prisma.payment.findUnique({ where: { reference: event.reference } });
  if (!payment || payment.provider !== provider) throw new HttpError(404, "Payment not found");
  if (payment.status !== "PENDING") return payment;

  if (event.status === "FAILED") {
    return prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
  }

  const [updated] = await prisma.$transaction([
    prisma.payment.update({ where: { id: payment.id }, data: { status: "SUCCESS", confirmedAt: new Date() } }),
    prisma.ticket.update({ where: { id: payment.ticketId }, data: { amountPaid: { increment: payment.amount } } }),
  ]);

  return updated;
}
