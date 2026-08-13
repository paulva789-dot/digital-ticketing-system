import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

// Comma-separated list, e.g. "http://localhost:5173,http://localhost:8765" — the
// second default covers `flutter run -d chrome`, whose dev-server port varies.
const defaultCorsOrigins = ["http://localhost:5173", "http://localhost:8765"];

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()) : defaultCorsOrigins,
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "8h",
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
  },
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    from: process.env.SMTP_FROM ?? "Ticketing System <no-reply@example.com>",
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
    authToken: process.env.TWILIO_AUTH_TOKEN ?? "",
    fromNumber: process.env.TWILIO_FROM_NUMBER ?? "",
  },
  whatsapp: {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
  },
  captcha: {
    /** Cloudflare Turnstile secret key — enforced only on front-row bookings while stock is low. */
    turnstileSecretKey: process.env.TURNSTILE_SECRET_KEY ?? "",
  },
  payments: {
    mtnMomo: {
      apiKey: process.env.MTN_MOMO_API_KEY ?? "",
      apiUser: process.env.MTN_MOMO_API_USER ?? "",
      subscriptionKey: process.env.MTN_MOMO_SUBSCRIPTION_KEY ?? "",
      env: process.env.MTN_MOMO_ENV ?? "sandbox",
      /** Shared secret MTN sends back in an `X-Webhook-Secret` header on their payment callback. */
      webhookSecret: process.env.MTN_MOMO_WEBHOOK_SECRET ?? "",
    },
    orangeMoney: {
      apiKey: process.env.ORANGE_MONEY_API_KEY ?? "",
      merchantKey: process.env.ORANGE_MONEY_MERCHANT_KEY ?? "",
      /** Shared secret Orange sends back in an `X-Webhook-Secret` header on their payment callback. */
      webhookSecret: process.env.ORANGE_MONEY_WEBHOOK_SECRET ?? "",
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY ?? "",
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
      /** Signing secret from the Stripe dashboard's webhook endpoint config (whsec_...). */
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    },
    flutterwave: {
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY ?? "",
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY ?? "",
      /** The "secret hash" set in the Flutterwave dashboard, echoed back in the `verif-hash` header. */
      webhookSecretHash: process.env.FLUTTERWAVE_SECRET_HASH ?? "",
    },
  },
};

export const isFirebaseConfigured = Boolean(
  env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey
);
export const isSmtpConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
export const isTwilioConfigured = Boolean(
  env.twilio.accountSid && env.twilio.authToken && env.twilio.fromNumber
);
export const isWhatsAppConfigured = Boolean(env.whatsapp.phoneNumberId && env.whatsapp.accessToken);
