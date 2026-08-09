import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth";
import { Ticket } from "../types";

export function MyTickets() {
  const { t } = useTranslation();
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/sign-in");
      return;
    }
    api
      .get<Ticket[]>("/api/users/me/tickets", token)
      .then(setTickets)
      .catch((err) => setError(err.message));
  }, [user, token, loading, navigate]);

  if (loading || !tickets) return <p className="themed-muted text-center py-12">Loading...</p>;

  return (
    <div className="max-w-md mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-6">{t("nav.myTickets")}</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid gap-3">
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            to={`/ticket/${ticket.id}`}
            className="themed-surface border themed-border rounded-lg p-4 flex justify-between items-center"
          >
            <div>
              <div className="font-medium">Ticket #{ticket.number}</div>
              <div className="text-xs themed-muted">{ticket.status}</div>
            </div>
            <div className="text-sm themed-muted">${ticket.totalPrice.toFixed(2)}</div>
          </Link>
        ))}
        {tickets.length === 0 && <p className="themed-muted">No tickets yet.</p>}
      </div>
    </div>
  );
}
