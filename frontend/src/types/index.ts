export type TicketStatus = "WAITING" | "CALLED" | "SERVING" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type TicketChannel = "WEB" | "APP" | "KIOSK";

export interface Service {
  id: string;
  name: string;
  description: string | null;
  avgServiceTimeMin: number;
  active: boolean;
}

export interface Ticket {
  id: string;
  number: number;
  serviceId: string;
  status: TicketStatus;
  channel: TicketChannel;
  createdAt: string;
  position?: number;
}

export interface QueueStatus {
  serviceId: string;
  waitingCount: number;
  nowServing: number | null;
  estimatedWaitMin: number;
}

export interface StaffSession {
  token: string;
  staff: { id: string; email: string; name: string; role: "STAFF" | "ADMIN" };
}
