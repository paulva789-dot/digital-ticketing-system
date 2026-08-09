import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { usePremium } from "../premium";
import { Service, Ticket } from "../types";

function discountPctForQuantity(quantity: number): number {
  if (quantity >= 5) return 20;
  if (quantity >= 2) return 10;
  return 0;
}

export function BookTicket() {
  const { t } = useTranslation();
  const { serviceId } = useParams<{ serviceId: string }>();
  const { isPremium } = usePremium();
  const [service, setService] = useState<Service | null>(null);
  const [loadingService, setLoadingService] = useState(true);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [seatType, setSeatType] = useState<"STANDARD" | "FRONT_ROW">("STANDARD");
  const [scheduledAt, setScheduledAt] = useState("");
  const [payInInstallments, setPayInInstallments] = useState(false);
  const [installments, setInstallments] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<Service[]>("/api/services")
      .then((services) => setService(services.find((s) => s.id === serviceId) ?? null))
      .finally(() => setLoadingService(false));
  }, [serviceId]);

  const frontRowRemaining = service ? service.frontRowStock - service.frontRowSold : 0;
  const windowCloses = service
    ? new Date(new Date(service.frontRowReleaseAt).getTime() + service.frontRowWindowDays * 86400000)
    : null;
  const withinFreeWindow = service && windowCloses ? new Date() <= windowCloses : false;

  const frontRowBlockedReason = useMemo(() => {
    if (!service || seatType !== "FRONT_ROW") return null;
    if (frontRowRemaining <= 0) return "Sold out.";
    if (!isPremium && !withinFreeWindow) {
      return `Free accounts can only book front-row within ${service.frontRowWindowDays} days of release. Go Premium for anytime access.`;
    }
    if (!isPremium && quantity > 1) {
      return "Free accounts are limited to 1 front-row ticket per order. Go Premium for more.";
    }
    return null;
  }, [service, seatType, frontRowRemaining, isPremium, withinFreeWindow, quantity]);

  const discountPct = discountPctForQuantity(quantity);
  const unitPrice = service ? service.price + (seatType === "FRONT_ROW" ? service.frontRowSurcharge : 0) : 0;
  const totalPrice = Math.round(unitPrice * quantity * (1 - discountPct / 100) * 100) / 100;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (frontRowBlockedReason) return;
    setSubmitting(true);
    setError(null);
    try {
      const { ticket, qrCode } = await api.post<{ ticket: Ticket; qrCode: string }>("/api/tickets", {
        serviceId,
        channel: "WEB",
        contactEmail: email || undefined,
        contactPhone: phone || undefined,
        quantity,
        seatType,
        paymentPlan: payInInstallments ? "INSTALLMENT" : "FULL",
        installments: payInInstallments ? installments : 1,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      });
      navigate(`/ticket/${ticket.id}`, { state: { qrCode } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingService) {
    return (
      <div className="max-w-md mx-auto py-12 px-6 grid gap-4">
        <div className="skeleton h-8 w-2/3 rounded-md" />
        <div className="skeleton h-20 rounded-lg" />
        <div className="skeleton h-10 rounded-md" />
        <div className="skeleton h-10 rounded-md" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-1">{t("book.title")}</h1>
      {service && <p className="themed-muted text-sm mb-6">{service.name}</p>}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSeatType("STANDARD")}
            className={`rounded-lg border themed-border p-3 text-left ${seatType === "STANDARD" ? "themed-accent" : "themed-surface"}`}
          >
            <div className="font-medium">{t("book.standard")}</div>
            <div className="text-xs opacity-80">
              ${service?.price.toFixed(2) ?? "0.00"} {t("book.perTicket")}
            </div>
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSeatType("FRONT_ROW")}
            className={`rounded-lg border themed-border p-3 text-left ${seatType === "FRONT_ROW" ? "themed-accent" : "themed-surface"}`}
          >
            <div className="font-medium">
              {t("book.frontRow")} {isPremium && "★"}
            </div>
            <div className="text-xs opacity-80">
              +${service?.frontRowSurcharge.toFixed(2) ?? "0.00"} &middot; {frontRowRemaining} {t("book.left")}
            </div>
          </motion.button>
        </div>
        <AnimatePresence>
          {seatType === "FRONT_ROW" && frontRowBlockedReason && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-amber-500 text-sm"
            >
              {frontRowBlockedReason}
            </motion.p>
          )}
        </AnimatePresence>

        <label className="grid gap-1">
          <span className="text-sm themed-muted">{t("book.quantity")}</span>
          <input
            type="number"
            min={1}
            max={10}
            value={quantity}
            onChange={(e) => setQuantity(Math.min(10, Math.max(1, Number(e.target.value))))}
            className="themed-surface border themed-border rounded-md px-3 py-2"
          />
          <AnimatePresence>
            {discountPct > 0 && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="text-emerald-500 text-xs"
              >
                🎉 {discountPct}% {t("book.discountApplied", { quantity })}
              </motion.span>
            )}
          </AnimatePresence>
        </label>

        <label className="grid gap-1">
          <span className="text-sm themed-muted">{t("book.appointment")}</span>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="themed-surface border themed-border rounded-md px-3 py-2"
          />
          <span className="text-xs themed-muted">{t("book.appointmentHint")}</span>
        </label>

        <label className="grid gap-1">
          <span className="text-sm themed-muted">{t("book.email")}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="themed-surface border themed-border rounded-md px-3 py-2"
            placeholder="you@example.com"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm themed-muted">{t("book.phone")}</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="themed-surface border themed-border rounded-md px-3 py-2"
            placeholder="+2547..."
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={payInInstallments} onChange={(e) => setPayInInstallments(e.target.checked)} />
          {t("book.installments")}
        </label>
        {payInInstallments && (
          <label className="grid gap-1">
            <span className="text-sm themed-muted">{t("book.installmentsCount")}</span>
            <select
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              className="themed-surface border themed-border rounded-md px-3 py-2"
            >
              {[2, 3, 4, 6].map((n) => (
                <option key={n} value={n}>
                  {n} payments of ${(totalPrice / n).toFixed(2)}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="themed-surface border themed-border rounded-lg p-4 flex justify-between items-baseline">
          <span className="text-sm themed-muted">{t("book.total")}</span>
          <AnimatePresence mode="wait">
            <motion.span
              key={totalPrice}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="text-xl font-bold"
            >
              ${totalPrice.toFixed(2)}
            </motion.span>
          </AnimatePresence>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={submitting || Boolean(frontRowBlockedReason)}
          className="themed-accent rounded-md py-2 font-medium disabled:opacity-50"
        >
          {submitting ? t("book.submitting") : t("book.submit")}
        </motion.button>
      </form>
    </div>
  );
}
