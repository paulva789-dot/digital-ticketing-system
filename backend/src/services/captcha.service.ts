import { env } from "../config/env";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** Whether a real Cloudflare Turnstile secret is configured for this deployment. */
export const isCaptchaConfigured = Boolean(env.captcha.turnstileSecretKey);

/**
 * Verifies a Cloudflare Turnstile token server-side. Callers should only enforce this
 * when `isCaptchaConfigured` is true — unconfigured deployments (local dev, this
 * scaffold out of the box) skip the check entirely rather than failing closed, matching
 * how every other third-party integration in this app behaves before real credentials
 * are set (see payment.service.ts's SANDBOX_CONFIG).
 */
export async function verifyCaptcha(token: string | undefined, remoteIp?: string): Promise<boolean> {
  if (!isCaptchaConfigured || !token) return false;

  const body = new URLSearchParams({ secret: env.captcha.turnstileSecretKey, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
