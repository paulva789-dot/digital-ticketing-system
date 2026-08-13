import { env, isWhatsAppConfigured } from "../config/env";

/**
 * Sends a freeform text message via the WhatsApp Business (Meta Cloud) API. Note: Meta
 * only allows freeform text within the 24h customer-service window after the user last
 * messaged the business — outside that window this requires a pre-approved message
 * template instead. This scaffold sends freeform text unconditionally; swap in template
 * messages for out-of-window sends (e.g. reminders) before relying on this in production.
 */
export async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!isWhatsAppConfigured) {
    console.log(`[whatsapp:stub] to=${to} body="${body}"`);
    return;
  }

  const url = `https://graph.facebook.com/v20.0/${env.whatsapp.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.whatsapp.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    console.error(`[whatsapp] send to ${to} failed (${res.status}): ${errorText}`);
  }
}
