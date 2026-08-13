import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

function timingSafeEqualStr(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Stripe's scheme: `Stripe-Signature: t=<unix ts>,v1=<hmac-sha256(secret, "ts.rawBody")>`. */
function verifyStripe(req: Request): boolean {
  const secret = env.payments.stripe.webhookSecret;
  const header = req.headers["stripe-signature"];
  if (!secret || typeof header !== "string" || !req.rawBody) return false;

  const parts = Object.fromEntries(
    header.split(",").map((kv) => kv.split("=") as [string, string])
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${req.rawBody.toString("utf8")}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");
  if (!timingSafeEqualStr(expected, signature)) return false;

  // Reject replays of old events (5 minute tolerance, matching Stripe's own default).
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  return ageSeconds < 5 * 60;
}

/** Flutterwave's scheme: the merchant-configured secret hash is echoed back verbatim in `verif-hash`. */
function verifyFlutterwave(req: Request): boolean {
  const secret = env.payments.flutterwave.webhookSecretHash;
  const header = req.headers["verif-hash"];
  if (!secret || typeof header !== "string") return false;
  return timingSafeEqualStr(header, secret);
}

/**
 * MTN MoMo / Orange Money don't have a standardized signature scheme available without
 * their SDKs, so this falls back to a shared secret configured out-of-band and sent back
 * as `X-Webhook-Secret` — replace with their real signing scheme once integrating for real.
 */
function verifySharedSecret(req: Request, secret: string): boolean {
  const header = req.headers["x-webhook-secret"];
  if (!secret || typeof header !== "string") return false;
  return timingSafeEqualStr(header, secret);
}

/**
 * Verifies the inbound payment webhook actually came from the provider before we let it
 * flip a PENDING payment to SUCCESS. Unconfigured providers (no webhook secret set) always
 * fail closed — the sandbox flow uses POST /api/payments/:id/confirm-sandbox instead.
 */
export function verifyProviderWebhook(req: Request, res: Response, next: NextFunction) {
  const provider = req.params.provider?.toUpperCase();
  let ok = false;

  switch (provider) {
    case "STRIPE":
      ok = verifyStripe(req);
      break;
    case "FLUTTERWAVE":
      ok = verifyFlutterwave(req);
      break;
    case "MTN_MOMO":
      ok = verifySharedSecret(req, env.payments.mtnMomo.webhookSecret);
      break;
    case "ORANGE_MONEY":
      ok = verifySharedSecret(req, env.payments.orangeMoney.webhookSecret);
      break;
    default:
      return res.status(400).json({ error: "Unknown payment provider" });
  }

  if (!ok) return res.status(401).json({ error: "Invalid or missing webhook signature" });
  next();
}
