import { sendEmail } from "./email.service";
import { sendSms } from "./sms.service";

interface TicketNotifyInput {
  email?: string | null;
  phone?: string | null;
  serviceName: string;
  ticketNumber: number;
}

export async function notifyTicketCreated(input: TicketNotifyInput): Promise<void> {
  const message = `Your ticket #${input.ticketNumber} for ${input.serviceName} has been booked. We'll notify you when it's almost your turn.`;
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
