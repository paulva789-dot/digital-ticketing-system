import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { QueueStatus } from "../types";

interface Props {
  status: QueueStatus;
  ticketNumber: number;
  position?: number;
}

function Tile({ value, label, highlight }: { value: string | number; label: string; highlight?: boolean }) {
  return (
    <div
      className={`themed-surface border themed-border rounded-lg p-4 overflow-hidden ${highlight ? "pulse-accent" : ""}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-3xl font-bold"
        >
          {value}
        </motion.div>
      </AnimatePresence>
      <div className="text-xs themed-muted uppercase tracking-wide">{label}</div>
    </div>
  );
}

export function QueuePosition({ status, ticketNumber, position }: Props) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-4 text-center">
      <Tile value={ticketNumber} label={t("ticket.yourNumber")} />
      <Tile value={status.nowServing ?? "—"} label={t("ticket.nowServing")} highlight={status.nowServing != null} />
      <Tile value={position ?? status.waitingCount} label={t("ticket.peopleAhead")} />
      <Tile value={`${status.estimatedWaitMin}m`} label={t("ticket.estWait")} />
    </div>
  );
}
