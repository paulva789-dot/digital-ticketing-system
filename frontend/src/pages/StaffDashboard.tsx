import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
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
    api.get<QueueStatus>(`/api/queue/${selectedService}`).then(setQueueStatus);
  }, [selectedService, calledTicket]);

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

  if (!session) return null;

  return (
    <div className="max-w-xl mx-auto py-12 px-6 grid gap-6">
      <h1 className="text-2xl font-bold">Staff dashboard — {session.staff.name}</h1>

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
        <div className="themed-surface border themed-border rounded-lg p-4 flex justify-between text-sm">
          <span>Waiting: {queueStatus.waitingCount}</span>
          <span>Now serving: {queueStatus.nowServing ?? "—"}</span>
          <span>Est. wait: {queueStatus.estimatedWaitMin}m</span>
        </div>
      )}

      {calledTicket && (
        <div className="border border-amber-500/40 rounded-lg p-4 flex items-center justify-between">
          <span className="font-medium">Now calling ticket #{calledTicket.number}</span>
          <button onClick={completeCurrent} className="themed-accent text-sm rounded-md px-3 py-1.5">
            Mark complete
          </button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={callNext}
        disabled={!selectedService}
        className="themed-accent rounded-md py-2 font-medium disabled:opacity-50"
      >
        Call next ticket
      </button>
    </div>
  );
}
