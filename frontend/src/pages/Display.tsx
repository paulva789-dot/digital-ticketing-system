import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { socket } from "../socket";
import { QueueStatus, Service } from "../types";

/**
 * Public, unauthenticated "now serving" board for a lobby TV/monitor. Deliberately
 * ignores the app's light/dark/event theme toggle — digital signage runs its own
 * fixed high-contrast look regardless of what an individual admin has set.
 */
export function Display() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!serviceId) return;

    api
      .get<QueueStatus>(`/api/queue/${serviceId}`)
      .then(setStatus)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load queue"));

    socket.connect();
    socket.emit("queue:subscribe", serviceId);

    const onUpdate = (payload: QueueStatus) => setStatus(payload);
    const onCalled = () => {
      setFlash(true);
      setTimeout(() => setFlash(false), 1500);
    };

    socket.on("queue:update", onUpdate);
    socket.on("ticket:called", onCalled);

    return () => {
      socket.emit("queue:unsubscribe", serviceId);
      socket.off("queue:update", onUpdate);
      socket.off("ticket:called", onCalled);
      socket.disconnect();
    };
  }, [serviceId]);

  if (!serviceId) return <DisplayServicePicker />;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-10 px-8 py-12">
      {error && <p className="text-red-400 text-2xl">{error}</p>}
      {status && (
        <>
          <h1 className="text-3xl md:text-5xl font-semibold text-slate-300 tracking-wide">{status.serviceName}</h1>

          <motion.div
            animate={flash ? { scale: [1, 1.08, 1] } : { scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="text-2xl md:text-3xl uppercase tracking-[0.3em] text-amber-400 mb-4">Now serving</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={status.nowServing ?? "none"}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="text-[10rem] md:text-[14rem] leading-none font-black"
              >
                {status.nowServing ?? "—"}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {status.upNext.length > 0 && (
            <div className="text-center">
              <div className="text-xl md:text-2xl uppercase tracking-[0.3em] text-slate-400 mb-3">Up next</div>
              <div className="flex gap-4 text-4xl md:text-6xl font-bold text-slate-200">
                {status.upNext.map((n) => (
                  <span key={n} className="px-4">
                    {n}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-slate-500 text-lg md:text-xl">
            {status.waitingCount} waiting &middot; est. {status.estimatedWaitMin}m
          </div>
        </>
      )}
    </div>
  );
}

function DisplayServicePicker() {
  const [services, setServices] = useState<Service[] | null>(null);

  useEffect(() => {
    api.get<Service[]>("/api/services").then(setServices);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-6 px-8">
      <h1 className="text-3xl font-bold">Choose a queue to display</h1>
      <div className="grid gap-3 w-full max-w-sm">
        {(services ?? []).map((s) => (
          <Link
            key={s.id}
            to={`/display/${s.id}`}
            className="border border-slate-700 rounded-lg p-4 text-center text-lg hover:bg-slate-900"
          >
            {s.name}
          </Link>
        ))}
        {services?.length === 0 && <p className="text-slate-400 text-center">No active services.</p>}
      </div>
    </div>
  );
}
