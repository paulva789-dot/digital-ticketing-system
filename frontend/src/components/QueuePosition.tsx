import { QueueStatus } from "../types";

interface Props {
  status: QueueStatus;
  ticketNumber: number;
  position?: number;
}

export function QueuePosition({ status, ticketNumber, position }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 text-center">
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="text-3xl font-bold text-slate-900">{ticketNumber}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">Your number</div>
      </div>
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="text-3xl font-bold text-slate-900">{status.nowServing ?? "—"}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">Now serving</div>
      </div>
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="text-3xl font-bold text-slate-900">{position ?? status.waitingCount}</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">People ahead</div>
      </div>
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="text-3xl font-bold text-slate-900">{status.estimatedWaitMin}m</div>
        <div className="text-xs text-slate-500 uppercase tracking-wide">Est. wait</div>
      </div>
    </div>
  );
}
