import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { AnalyticsOverview, StaffSession } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

interface ServiceStats {
  serviceId: string;
  serviceName: string;
  completedToday: number;
  waiting: number;
}

function useStaffSession(): StaffSession | null {
  const raw = localStorage.getItem("staffSession");
  return raw ? (JSON.parse(raw) as StaffSession) : null;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function AdminAnalytics() {
  const session = useStaffSession();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ServiceStats[]>([]);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.staff.role !== "ADMIN") {
      navigate("/staff/login");
      return;
    }
    Promise.all([
      api.get<ServiceStats[]>("/api/analytics/tickets-per-service", session.token),
      api.get<AnalyticsOverview>("/api/analytics/overview", session.token),
    ])
      .then(([serviceStats, overviewData]) => {
        setStats(serviceStats);
        setOverview(overviewData);
      })
      .catch((err) => setError(err.message));
  }, [session, navigate]);

  if (!session) return null;

  const cardClass = "themed-surface border themed-border rounded-lg p-4";

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 grid gap-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">Queue analytics</h1>
        <div className="flex gap-4 text-sm">
          <Link to="/staff/dashboard" className="hover:opacity-80">
            Dashboard
          </Link>
          <Link to="/staff/services" className="hover:opacity-80">
            Manage services
          </Link>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className={cardClass}>
        <h2 className="text-sm font-medium themed-muted mb-3">Completed vs. waiting, today</h2>
        <Bar
          data={{
            labels: stats.map((s) => s.serviceName),
            datasets: [
              { label: "Completed today", data: stats.map((s) => s.completedToday), backgroundColor: "#4f46e5" },
              { label: "Currently waiting", data: stats.map((s) => s.waiting), backgroundColor: "#94a3b8" },
            ],
          }}
          options={{ responsive: true, plugins: { legend: { position: "bottom" } } }}
        />
      </div>

      {overview && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className={cardClass}>
            <h2 className="text-sm font-medium themed-muted mb-3">Revenue, last 14 days</h2>
            <Line
              data={{
                labels: overview.revenueByDay.map((d) => shortDate(d.date)),
                datasets: [
                  {
                    label: "Revenue ($)",
                    data: overview.revenueByDay.map((d) => d.amount),
                    borderColor: "#10b981",
                    backgroundColor: "#10b98133",
                    tension: 0.3,
                    fill: true,
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>

          <div className={cardClass}>
            <h2 className="text-sm font-medium themed-muted mb-3">Tickets booked, last 14 days</h2>
            <Line
              data={{
                labels: overview.ticketsByDay.map((d) => shortDate(d.date)),
                datasets: [
                  {
                    label: "Tickets",
                    data: overview.ticketsByDay.map((d) => d.count),
                    borderColor: "#4f46e5",
                    backgroundColor: "#4f46e533",
                    tension: 0.3,
                    fill: true,
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>

          <div className={cardClass}>
            <h2 className="text-sm font-medium themed-muted mb-3">No-show rate by service, last 30 days</h2>
            <Bar
              data={{
                labels: overview.noShowRateByService.map((s) => s.serviceName),
                datasets: [
                  {
                    label: "No-show %",
                    data: overview.noShowRateByService.map((s) => s.noShowRatePct),
                    backgroundColor: "#f59e0b",
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>

          <div className={cardClass}>
            <h2 className="text-sm font-medium themed-muted mb-3">Avg. time-to-call by service, last 30 days</h2>
            <Bar
              data={{
                labels: overview.avgWaitMinutesByService.map((s) => s.serviceName),
                datasets: [
                  {
                    label: "Minutes",
                    data: overview.avgWaitMinutesByService.map((s) => s.avgWaitMin),
                    backgroundColor: "#0ea5e9",
                  },
                ],
              }}
              options={{ responsive: true, plugins: { legend: { display: false } } }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
