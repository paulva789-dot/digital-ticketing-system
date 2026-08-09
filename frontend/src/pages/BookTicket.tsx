import { FormEvent, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Ticket } from "../types";

export function BookTicket() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { ticket, qrCode } = await api.post<{ ticket: Ticket; qrCode: string }>("/api/tickets", {
        serviceId,
        channel: "WEB",
        contactEmail: email || undefined,
        contactPhone: phone || undefined,
      });
      navigate(`/ticket/${ticket.id}`, { state: { qrCode } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Book your ticket</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1">
          <span className="text-sm text-slate-600">Email (optional)</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2"
            placeholder="you@example.com"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-sm text-slate-600">Phone (optional, for SMS alerts)</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border border-slate-300 rounded-md px-3 py-2"
            placeholder="+2547..."
          />
        </label>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-slate-900 text-white rounded-md py-2 font-medium disabled:opacity-50"
        >
          {submitting ? "Booking..." : "Get my ticket"}
        </button>
      </form>
    </div>
  );
}
