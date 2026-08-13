import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useParams } from "react-router-dom";
import { api } from "../api/client";
import { PaymentOptions } from "../components/PaymentOptions";
import { QRCodeDisplay } from "../components/QRCodeDisplay";
import { QueuePosition } from "../components/QueuePosition";
import { useAuth } from "../auth";
import { socket } from "../socket";
import { QueueStatus, Ticket } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function TicketStatus() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const qrCode = (location.state as { qrCode?: string } | null)?.qrCode;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [rescheduleAt, setRescheduleAt] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const [freeTrialUsed, setFreeTrialUsed] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  function refreshTicket() {
    if (!id) return;
    api
      .get<Ticket>(`/api/tickets/${id}`)
      .then(async (t) => {
        setTicket(t);
        const status = await api.get<QueueStatus>(`/api/queue/${t.serviceId}`);
        setQueueStatus(status);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(refreshTicket, [id]);

  useEffect(() => {
    if (!user || !token) return;
    api
      .get<{ freeTrialUsed: boolean }>("/api/users/me", token)
      .then((u) => setFreeTrialUsed(u.freeTrialUsed))
      .catch(() => {});
  }, [user, token]);

  useEffect(() => {
    if (!ticket) return;
    socket.connect();
    socket.emit("queue:subscribe", ticket.serviceId);

    const onUpdate = (status: QueueStatus) => setQueueStatus(status);
    const onCalled = (payload: { ticketId: string }) => {
      if (payload.ticketId === ticket.id) {
        setTicket((prev) => (prev ? { ...prev, status: "CALLED" } : prev));
      }
    };

    socket.on("queue:update", onUpdate);
    socket.on("ticket:called", onCalled);

    return () => {
      socket.emit("queue:unsubscribe", ticket.serviceId);
      socket.off("queue:update", onUpdate);
      socket.off("ticket:called", onCalled);
      socket.disconnect();
    };
  }, [ticket?.serviceId, ticket?.id]);

  async function handlePayInstallment() {
    if (!id || !payAmount) return;
    setPaying(true);
    setError(null);
    try {
      await api.post(`/api/tickets/${id}/pay-installment`, { amount: Number(payAmount) });
      setPayAmount("");
      refreshTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  }

  async function handleReschedule() {
    if (!id || !rescheduleAt) return;
    setRescheduling(true);
    setError(null);
    try {
      await api.post(
        `/api/tickets/${id}/reschedule`,
        { scheduledAt: new Date(rescheduleAt).toISOString() },
        token
      );
      setRescheduleAt("");
      refreshTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setRescheduling(false);
    }
  }

  async function handleCancel() {
    if (!id || !window.confirm(t("ticket.cancelConfirm"))) return;
    setCancelling(true);
    setError(null);
    try {
      await api.post(`/api/tickets/${id}/cancel`, undefined, token);
      refreshTicket();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setCancelling(false);
    }
  }

  if (error) return <p className="text-red-500 text-center py-12">{error}</p>;
  if (!ticket || !queueStatus) return <p className="themed-muted text-center py-12">Loading...</p>;

  const balance = Math.max(0, ticket.totalPrice - ticket.amountPaid);

  return (
    <div className="max-w-md mx-auto py-12 px-6 grid gap-8">
      <div className="text-center">
        <motion.h1
          key={ticket.status}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={ticket.status === "CALLED" ? { opacity: 1, scale: [0.9, 1.06, 1] } : { opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-bold"
        >
          {ticket.status === "CALLED" ? t("ticket.yourTurn") : t("ticket.inQueue")}
        </motion.h1>
        <p className="themed-muted text-sm mt-1">
          {t("ticket.status")}: {ticket.status}
        </p>
        {ticket.scheduledAt && (
          <p className="themed-muted text-sm">📅 {new Date(ticket.scheduledAt).toLocaleString()}</p>
        )}
      </div>

      {qrCode && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <QRCodeDisplay qrCode={qrCode} label="Show this at the counter" />
        </motion.div>
      )}

      <div className="themed-surface border themed-border rounded-lg p-4 grid gap-2 text-sm">
        <div className="flex justify-between">
          <span className="themed-muted">{t("ticket.seatType")}</span>
          <span>{ticket.seatType === "FRONT_ROW" ? "Front Row ★" : t("book.standard")}</span>
        </div>
        <div className="flex justify-between">
          <span className="themed-muted">{t("ticket.quantity")}</span>
          <span>{ticket.quantity}</span>
        </div>
        {ticket.discountPct > 0 && (
          <div className="flex justify-between text-emerald-500">
            <span>{t("ticket.discount")}</span>
            <span>-{ticket.discountPct}%</span>
          </div>
        )}
        <div className="flex justify-between font-semibold">
          <span>{t("ticket.total")}</span>
          <span>${ticket.totalPrice.toFixed(2)}</span>
        </div>
        {balance > 0 && (
          <div className="flex justify-between">
            <span className="themed-muted">{t("ticket.balanceDue")}</span>
            <span>${balance.toFixed(2)}</span>
          </div>
        )}
      </div>

      {balance > 0 && (
        <div className="themed-surface border themed-border rounded-lg p-4">
          <PaymentOptions ticketId={ticket.id} freeTrialUsed={freeTrialUsed} onPaid={refreshTicket} />
        </div>
      )}

      {ticket.paymentPlan === "INSTALLMENT" && balance > 0 && (
        <div className="themed-surface border themed-border rounded-lg p-4 grid gap-2">
          <span className="text-sm font-medium">Manual installment top-up</span>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              step="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder={`up to $${balance.toFixed(2)}`}
              className="themed-surface border themed-border rounded-md px-3 py-2 flex-1"
            />
            <button
              onClick={handlePayInstallment}
              disabled={paying || !payAmount}
              className="themed-accent rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {paying ? "..." : t("payment.pay")}
            </button>
          </div>
        </div>
      )}

      {ticket.status === "WAITING" && ticket.scheduledAt && (
        <div className="themed-surface border themed-border rounded-lg p-4 grid gap-2">
          <span className="text-sm font-medium">{t("ticket.reschedule")}</span>
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={rescheduleAt}
              onChange={(e) => setRescheduleAt(e.target.value)}
              className="themed-surface border themed-border rounded-md px-3 py-2 flex-1"
            />
            <button
              onClick={handleReschedule}
              disabled={rescheduling || !rescheduleAt}
              className="themed-accent rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {rescheduling ? "..." : t("ticket.rescheduleSave")}
            </button>
          </div>
        </div>
      )}

      <a
        href={`${API_URL}/api/tickets/${ticket.id}/document`}
        target="_blank"
        rel="noreferrer"
        className="themed-accent text-center rounded-md py-2 font-medium"
      >
        {t("ticket.document")}
      </a>

      {ticket.status === "CANCELLED" ? (
        <p className="text-center themed-muted text-sm">{t("ticket.cancelled")}</p>
      ) : (
        <>
          <QueuePosition status={queueStatus} ticketNumber={ticket.number} position={ticket.position} />
          {(ticket.status === "WAITING" || ticket.status === "CALLED") && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-red-500 text-sm font-medium border border-red-500/40 rounded-md py-2 disabled:opacity-50"
            >
              {cancelling ? "..." : t("ticket.cancel")}
            </button>
          )}
        </>
      )}
    </div>
  );
}
