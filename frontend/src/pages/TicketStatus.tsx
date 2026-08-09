import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { api } from "../api/client";
import { QRCodeDisplay } from "../components/QRCodeDisplay";
import { QueuePosition } from "../components/QueuePosition";
import { socket } from "../socket";
import { QueueStatus, Ticket } from "../types";

export function TicketStatus() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const qrCode = (location.state as { qrCode?: string } | null)?.qrCode;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<Ticket>(`/api/tickets/${id}`)
      .then(async (t) => {
        setTicket(t);
        const status = await api.get<QueueStatus>(`/api/queue/${t.serviceId}`);
        setQueueStatus(status);
      })
      .catch((err) => setError(err.message));
  }, [id]);

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

  if (error) return <p className="text-red-600 text-center py-12">{error}</p>;
  if (!ticket || !queueStatus) return <p className="text-slate-400 text-center py-12">Loading...</p>;

  return (
    <div className="max-w-md mx-auto py-12 px-6 grid gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          {ticket.status === "CALLED" ? "It's your turn!" : "You're in the queue"}
        </h1>
        <p className="text-slate-500 text-sm mt-1">Status: {ticket.status}</p>
      </div>

      {qrCode && <QRCodeDisplay qrCode={qrCode} label="Show this at the counter" />}

      <QueuePosition status={queueStatus} ticketNumber={ticket.number} position={ticket.position} />
    </div>
  );
}
