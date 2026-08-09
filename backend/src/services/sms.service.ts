import Twilio from "twilio";
import { env, isTwilioConfigured } from "../config/env";

const client = isTwilioConfigured ? Twilio(env.twilio.accountSid, env.twilio.authToken) : null;

export async function sendSms(to: string, body: string): Promise<void> {
  if (!client) {
    console.log(`[sms:stub] to=${to} body="${body}"`);
    return;
  }
  await client.messages.create({ to, from: env.twilio.fromNumber, body });
}
