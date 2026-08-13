import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { socket } from "../socket";
import { QueueStatus, Service, StaffSession, Ticket } from "../types";

function useStaffSession(): StaffSession | null {
  const raw = localStorage.getItem("staffSession");
  return raw ? (JSON.parse(raw) as StaffSession) : null;
}

export function StaffDashboard() {
  const session = useStaffSession();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [calledTicket, setCalledTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      navigate("/staff/login");
      return;
    }
    api.get<Service[]>("/api/services").then((list) => {
      setServices(list);
      if (list[0]) setSelectedService(list[0].id);
    });
  }, [session, navigate]);

  useEffect(() => {
    if (!selectedService) return;
    setQueueStatus(null);
    api.get<QueueStatus>(`/api/queue/${selectedService}`).then(setQueueStatus);

    socket.connect();
    socket.emit("queue:subscribe", selectedService);
    const onUpdate = (payload: QueueStatus) => setQueueStatus(payload);
    socket.on("queue:update", onUpdate);

    return () => {
      socket.emit("queue:unsubscribe", selectedService);
      socket.off("queue:update", onUpdate);
      socket.disconnect();
    };
  }, [selectedService]);

  async function callNext() {
    if (!session) return;
    setError(null);
    try {
      const ticket = await api.post<Ticket>(
        `/api/tickets/services/${selectedService}/call-next`,
        undefined,
        session.token
      );
      setCalledTicket(ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to call next ticket");
    }
  }

  async function completeCurrent() {
    if (!session || !calledTicket) return;
    await api.post(`/api/tickets/${calledTicket.id}/status`, { status: "COMPLETED" }, session.token);
    setCalledTicket(null);
  }

  async function markNoShow() {
    if (!session || !calledTicket) return;
    await api.post(`/api/tickets/${calledTicket.id}/status`, { status: "NO_SHOW" }, session.token);
    setCalledTicket(null);
  }

  if (!session) return null;

  return (
    <div className="max-w-xl mx-auto py-12 px-6 grid gap-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Staff dashboard — {session.staff.name}</h1>
        <div className="flex gap-4 text-sm">
          {selectedService && (
            <Link to={`/display/${selectedService}`} target="_blank" rel="noreferrer" className="hover:opacity-80">
              Open display board
            </Link>
          )}
          {session.staff.role === "ADMIN" && (
            <>
              <Link to="/staff/analytics" className="hover:opacity-80">
                Analytics
              </Link>
              <Link to="/staff/services" className="hover:opacity-80">
                Manage services
              </Link>
            </>
          )}
        </div>
      </div>

      <label className="grid gap-1">
        <span className="text-sm themed-muted">Service</span>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
          className="themed-surface border themed-border rounded-md px-3 py-2"
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      {queueStatus && (
        <div className="themed-surface border themed-border rounded-lg p-4 grid gap-2">
          <div className="flex items-center gap-1.5 text-xs themed-muted">
            <motion.span
              className="inline-block w-2 h-2 rounded-full bg-emerald-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            Live
          </div>
          <div className="flex justify-between text-sm">
            <StatCounter label="Waiting" value={queueStatus.waitingCount} />
            <StatCounter label="Now serving" value={queueStatus.nowServing ?? "—"} />
            <StatCounter label="Est. wait" value={`${queueStatus.estimatedWaitMin}m`} />
          </div>
          {queueStatus.upNext.length > 0 && (
            <div className="text-xs themed-muted">Up next: {queueStatus.upNext.join(", ")}</div>
          )}
        </div>
      )}

      {calledTicket && (
        <div className="border border-amber-500/40 rounded-lg p-4 flex items-center justify-between gap-3">
          <span className="font-medium">Now calling ticket #{calledTicket.number}</span>
          <div className="flex gap-2">
            <button
              onClick={markNoShow}
              className="text-sm rounded-md px-3 py-1.5 border themed-border text-red-500"
            >
              No show
            </button>
            <button onClick={completeCurrent} className="themed-accent text-sm rounded-md px-3 py-1.5">
              Mark complete
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={callNext}
        disabled={!selectedService || Boolean(calledTicket)}
        className="themed-accent rounded-md py-2 font-medium disabled:opacity-50"
        title={calledTicket ? "Resolve the current ticket (complete or no-show) before calling the next one" : undefined}
      >
        Call next ticket
      </button>
    </div>
  );
}

function StatCounter({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="themed-muted text-xs">{label}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15 }}
          className="font-semibold"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
