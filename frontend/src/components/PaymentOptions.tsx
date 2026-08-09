import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/client";
import { useAuth } from "../auth";

type Provider = "MTN_MOMO" | "ORANGE_MONEY" | "STRIPE" | "FLUTTERWAVE" | "FREE_TRIAL";

const PROVIDERS: { id: Provider; label: string; emoji: string }[] = [
  { id: "MTN_MOMO", label: "MTN MoMo", emoji: "📱" },
  { id: "ORANGE_MONEY", label: "Orange Money", emoji: "🟠" },
  { id: "STRIPE", label: "Stripe", emoji: "💳" },
  { id: "FLUTTERWAVE", label: "Flutterwave", emoji: "🌊" },
];

interface InitiateResponse {
  paymentId: string;
  reference: string;
  status: "PENDING" | "SUCCESS";
  provider: Provider;
  instructions: string;
}

export function PaymentOptions({
  ticketId,
  freeTrialUsed,
  onPaid,
}: {
  ticketId: string;
  freeTrialUsed: boolean;
  onPaid: () => void;
}) {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [result, setResult] = useState<InitiateResponse | null>(null);
  const [busyProvider, setBusyProvider] = useState<Provider | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay(provider: Provider) {
    setBusyProvider(provider);
    setError(null);
    try {
      const res = await api.post<InitiateResponse>("/api/payments/initiate", { ticketId, provider }, token);
      setResult(res);
      if (res.status === "SUCCESS") onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed to start");
    } finally {
      setBusyProvider(null);
    }
  }

  async function confirmSandbox() {
    if (!result) return;
    setConfirming(true);
    try {
      await api.post(`/api/payments/${result.paymentId}/confirm-sandbox`);
      onPaid();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Confirmation failed");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="grid gap-3">
      <span className="text-sm font-medium">{t("payment.title")}</span>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        disabled={freeTrialUsed || !user || busyProvider !== null}
        onClick={() => pay("FREE_TRIAL")}
        className="rounded-md py-2 font-medium text-sm border themed-border themed-accent disabled:opacity-50"
        title={!user ? t("payment.signInForTrial") : freeTrialUsed ? t("payment.freeTrialUsed") : undefined}
      >
        🎁 {t("payment.freeTrial")}
      </motion.button>

      <div className="grid grid-cols-2 gap-2">
        {PROVIDERS.map((p) => (
          <motion.button
            key={p.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={busyProvider !== null}
            onClick={() => pay(p.id)}
            className="themed-surface border themed-border rounded-md py-2 text-sm font-medium disabled:opacity-50"
          >
            {p.emoji} {p.label}
          </motion.button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {result && result.status === "PENDING" && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="themed-surface border themed-border rounded-md p-3 text-sm grid gap-2"
        >
          <p className="themed-muted">{result.instructions}</p>
          <p className="text-xs themed-muted italic">{t("payment.sandboxNotice")}</p>
          <button
            onClick={confirmSandbox}
            disabled={confirming}
            className="themed-accent rounded-md py-1.5 text-sm font-medium disabled:opacity-50"
          >
            {confirming ? "..." : t("payment.confirmSandbox")}
          </button>
        </motion.div>
      )}

      {result && result.status === "SUCCESS" && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-500 text-sm font-medium">
          ✅ {t("payment.success")}
        </motion.p>
      )}
    </div>
  );
}
