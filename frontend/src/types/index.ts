export type TicketStatus = "WAITING" | "CALLED" | "SERVING" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type TicketChannel = "WEB" | "APP" | "KIOSK";
export type SeatType = "STANDARD" | "FRONT_ROW";
export type PaymentPlan = "FULL" | "INSTALLMENT";

export interface Service {
  id: string;
  name: string;
  description: string | null;
  avgServiceTimeMin: number;
  active: boolean;
  price: number;
  frontRowSurcharge: number;
  frontRowStock: number;
  frontRowSold: number;
  frontRowReleaseAt: string;
  frontRowWindowDays: number;
}

export interface Ticket {
  id: string;
  number: number;
  serviceId: string;
  status: TicketStatus;
  channel: TicketChannel;
  seatType: SeatType;
  quantity: number;
  unitPrice: number;
  discountPct: number;
  totalPrice: number;
  paymentPlan: PaymentPlan;
  installments: number;
  amountPaid: number;
  scheduledAt?: string | null;
  rescheduleCount?: number;
  createdAt: string;
  position?: number;
}

export interface AppUser {
  id: string;
  firebaseUid: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  isPremium: boolean;
  freeTrialUsed: boolean;
  locale: string;
  createdAt: string;
}

export interface QueueStatus {
  serviceId: string;
  serviceName: string;
  waitingCount: number;
  nowServing: number | null;
  upNext: number[];
  estimatedWaitMin: number;
}

export interface StaffSession {
  token: string;
  staff: { id: string; email: string; name: string; role: "STAFF" | "ADMIN" };
}

export interface AnalyticsOverview {
  revenueByDay: { date: string; amount: number }[];
  ticketsByDay: { date: string; count: number }[];
  noShowRateByService: { serviceId: string; serviceName: string; totalCalled: number; noShowRatePct: number }[];
  avgWaitMinutesByService: { serviceId: string; serviceName: string; avgWaitMin: number }[];
}

export interface SecurityApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  experience: string | null;
  message: string | null;
  status: "RECEIVED" | "REVIEWING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}
