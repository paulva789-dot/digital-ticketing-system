import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Service } from "../types";

export function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<Service[]>("/api/services")
      .then(setServices)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Choose a service</h1>
      <p className="text-slate-500 mb-8">Book a ticket and skip the physical line.</p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="grid gap-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => navigate(`/book/${service.id}`)}
            className="text-left bg-white border border-slate-200 rounded-lg p-4 hover:border-slate-400 transition"
          >
            <div className="font-medium text-slate-900">{service.name}</div>
            {service.description && <div className="text-sm text-slate-500">{service.description}</div>}
          </button>
        ))}
        {services.length === 0 && !error && <p className="text-slate-400">No services available yet.</p>}
      </div>
    </div>
  );
}
