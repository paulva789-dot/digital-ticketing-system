import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { StaffSession } from "../types";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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

export function AdminAnalytics() {
  const session = useStaffSession();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ServiceStats[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.staff.role !== "ADMIN") {
      navigate("/staff/login");
      return;
    }
    api
      .get<ServiceStats[]>("/api/analytics/tickets-per-service", session.token)
      .then(setStats)
      .catch((err) => setError(err.message));
  }, [session, navigate]);

  if (!session) return null;

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold mb-6">Queue analytics</h1>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="themed-surface border themed-border rounded-lg p-4">
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
    </div>
  );
}
