import { sendEmail } from "./email.service";
import { sendSms } from "./sms.service";

interface TicketNotifyInput {
  email?: string | null;
  phone?: string | null;
  serviceName: string;
  ticketNumber: number;
  quantity?: number;
  seatType?: string;
  totalPrice?: number;
  discountPct?: number;
  paymentPlan?: string;
  amountPaid?: number;
}

export async function notifyTicketCreated(input: TicketNotifyInput): Promise<void> {
  const seatLabel = input.seatType === "FRONT_ROW" ? "Front Row" : "Standard";
  const qty = input.quantity ?? 1;
  const priceLine =
    input.totalPrice !== undefined
      ? ` Total: $${input.totalPrice.toFixed(2)}${input.discountPct ? ` (${input.discountPct}% multi-ticket discount applied)` : ""}.` +
        (input.paymentPlan === "INSTALLMENT"
          ? " You chose to pay in installments — complete your first payment from the ticket page."
          : input.totalPrice > 0
            ? " Complete payment from the ticket page to confirm your spot."
            : "")
      : "";
  const message = `Your ticket #${input.ticketNumber} for ${input.serviceName} (${qty}x ${seatLabel}) has been booked.${priceLine} We'll notify you when it's almost your turn. Your ticket document is available on the website/app.`;
  await Promise.allSettled([
    input.email ? sendEmail(input.email, "Ticket confirmed", message) : Promise.resolve(),
    input.phone ? sendSms(input.phone, message) : Promise.resolve(),
  ]);
}

export async function notifyTicketAlmostUp(input: TicketNotifyInput): Promise<void> {
  const message = `Heads up — ticket #${input.ticketNumber} for ${input.serviceName} is almost up. Please head to the counter.`;
  await Promise.allSettled([
    input.email ? sendEmail(input.email, "You're almost up", message) : Promise.resolve(),
    input.phone ? sendSms(input.phone, message) : Promise.resolve(),
  ]);
}

export async function notifySecurityApplicationReceived(input: { email: string; fullName: string }): Promise<void> {
  const message = `Hi ${input.fullName},\n\nThank you for applying, we will reach out to you soon.\n\n— Digital Ticketing Security Team`;
  await sendEmail(input.email, "We received your security application", message);
}
