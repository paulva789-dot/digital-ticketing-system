import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Service, StaffSession } from "../types";

function useStaffSession(): StaffSession | null {
  const raw = localStorage.getItem("staffSession");
  return raw ? (JSON.parse(raw) as StaffSession) : null;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  avgServiceTimeMin: 5,
  price: 0,
  frontRowSurcharge: 0,
  frontRowStock: 0,
  frontRowWindowDays: 3,
};

export function ManageServices() {
  const session = useStaffSession();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  function load() {
    if (!session) return;
    api
      .get<Service[]>("/api/services/admin/all", session.token)
      .then(setServices)
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (!session || session.staff.role !== "ADMIN") {
      navigate("/staff/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, navigate]);

  if (!session) return null;

  function updateField<K extends keyof Service>(id: string, field: K, value: Service[K]) {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  async function saveService(service: Service) {
    if (!session) return;
    setSavingId(service.id);
    setError(null);
    try {
      const updated = await api.patch<Service>(
        `/api/services/${service.id}`,
        {
          name: service.name,
          description: service.description ?? undefined,
          avgServiceTimeMin: service.avgServiceTimeMin,
          price: service.price,
          frontRowSurcharge: service.frontRowSurcharge,
          frontRowStock: service.frontRowStock,
          frontRowWindowDays: service.frontRowWindowDays,
          active: service.active,
        },
        session.token
      );
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save service");
    } finally {
      setSavingId(null);
    }
  }

  async function createService(e: FormEvent) {
    e.preventDefault();
    if (!session) return;
    setCreating(true);
    setError(null);
    try {
      await api.post("/api/services", form, session.token);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6 grid gap-8">
      <h1 className="text-2xl font-bold">Manage services</h1>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="grid gap-4">
        {services.map((service) => (
          <div key={service.id} className="themed-surface border themed-border rounded-lg p-4 grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="grid gap-1 text-sm">
                <span className="themed-muted">Name</span>
                <input
                  value={service.name}
                  onChange={(e) => updateField(service.id, "name", e.target.value)}
                  className="themed-surface border themed-border rounded-md px-2 py-1"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="themed-muted">Avg. service time (min)</span>
                <input
                  type="number"
                  min={1}
                  value={service.avgServiceTimeMin}
                  onChange={(e) => updateField(service.id, "avgServiceTimeMin", Number(e.target.value))}
                  className="themed-surface border themed-border rounded-md px-2 py-1"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="themed-muted">Price</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={service.price}
                  onChange={(e) => updateField(service.id, "price", Number(e.target.value))}
                  className="themed-surface border themed-border rounded-md px-2 py-1"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="themed-muted">Front-row surcharge</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={service.frontRowSurcharge}
                  onChange={(e) => updateField(service.id, "frontRowSurcharge", Number(e.target.value))}
                  className="themed-surface border themed-border rounded-md px-2 py-1"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="themed-muted">Front-row stock</span>
                <input
                  type="number"
                  min={0}
                  value={service.frontRowStock}
                  onChange={(e) => updateField(service.id, "frontRowStock", Number(e.target.value))}
                  className="themed-surface border themed-border rounded-md px-2 py-1"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="themed-muted">Free-tier booking window (days)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={service.frontRowWindowDays}
                  onChange={(e) => updateField(service.id, "frontRowWindowDays", Number(e.target.value))}
                  className="themed-surface border themed-border rounded-md px-2 py-1"
                />
              </label>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="themed-muted">
                Front-row sold: {service.frontRowSold} / {service.frontRowStock}
              </span>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={service.active}
                  onChange={(e) => updateField(service.id, "active", e.target.checked)}
                />
                Active
              </label>
              <button
                onClick={() => saveService(service)}
                disabled={savingId === service.id}
                className="themed-accent rounded-md px-3 py-1.5 disabled:opacity-50"
              >
                {savingId === service.id ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 && <p className="themed-muted text-sm">No services yet.</p>}
      </div>

      <div className="themed-surface border themed-border rounded-lg p-4 grid gap-3">
        <h2 className="font-semibold">Create a new service</h2>
        <form onSubmit={createService} className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm col-span-2">
            <span className="themed-muted">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="themed-surface border themed-border rounded-md px-2 py-1"
            />
          </label>
          <label className="grid gap-1 text-sm col-span-2">
            <span className="themed-muted">Description</span>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="themed-surface border themed-border rounded-md px-2 py-1"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="themed-muted">Avg. service time (min)</span>
            <input
              type="number"
              min={1}
              value={form.avgServiceTimeMin}
              onChange={(e) => setForm((f) => ({ ...f, avgServiceTimeMin: Number(e.target.value) }))}
              className="themed-surface border themed-border rounded-md px-2 py-1"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="themed-muted">Price</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              className="themed-surface border themed-border rounded-md px-2 py-1"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="themed-muted">Front-row surcharge</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.frontRowSurcharge}
              onChange={(e) => setForm((f) => ({ ...f, frontRowSurcharge: Number(e.target.value) }))}
              className="themed-surface border themed-border rounded-md px-2 py-1"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="themed-muted">Front-row stock</span>
            <input
              type="number"
              min={0}
              value={form.frontRowStock}
              onChange={(e) => setForm((f) => ({ ...f, frontRowStock: Number(e.target.value) }))}
              className="themed-surface border themed-border rounded-md px-2 py-1"
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="themed-muted">Free-tier booking window (days)</span>
            <input
              type="number"
              min={1}
              max={30}
              value={form.frontRowWindowDays}
              onChange={(e) => setForm((f) => ({ ...f, frontRowWindowDays: Number(e.target.value) }))}
              className="themed-surface border themed-border rounded-md px-2 py-1"
            />
          </label>
          <button
            type="submit"
            disabled={creating}
            className="themed-accent rounded-md py-2 font-medium col-span-2 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create service"}
          </button>
        </form>
      </div>
    </div>
  );
}
