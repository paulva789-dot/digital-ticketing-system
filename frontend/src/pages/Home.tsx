import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { Service } from "../types";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function Home() {
  const { t } = useTranslation();
  const [services, setServices] = useState<Service[] | null>(null);
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
      <h1 className="text-2xl font-bold mb-2">{t("home.title")}</h1>
      <p className="themed-muted mb-8">{t("home.subtitle")}</p>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {!services && !error && (
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton rounded-lg h-16 border themed-border" />
          ))}
        </div>
      )}

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3">
        {(services ?? []).map((service) => (
          <motion.button
            key={service.id}
            variants={item}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/book/${service.id}`)}
            className="text-left themed-surface border themed-border rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-baseline">
              <div className="font-medium">{service.name}</div>
              {service.price > 0 && (
                <div className="text-sm themed-muted">
                  {t("home.from")} ${service.price.toFixed(2)}
                </div>
              )}
            </div>
            {service.description && <div className="text-sm themed-muted">{service.description}</div>}
          </motion.button>
        ))}
        {services?.length === 0 && !error && <p className="themed-muted">{t("home.empty")}</p>}
      </motion.div>
    </div>
  );
}
