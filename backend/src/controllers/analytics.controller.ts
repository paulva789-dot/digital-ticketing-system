import { Request, Response } from "express";
import { prisma } from "../config/prisma";

export async function ticketsPerService(_req: Request, res: Response) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const services = await prisma.service.findMany({ where: { active: true } });

  const stats = await Promise.all(
    services.map(async (service) => {
      const [completedToday, waiting] = await Promise.all([
        prisma.ticket.count({
          where: { serviceId: service.id, status: "COMPLETED", completedAt: { gte: startOfDay } },
        }),
        prisma.ticket.count({ where: { serviceId: service.id, status: "WAITING" } }),
      ]);
      return { serviceId: service.id, serviceName: service.name, completedToday, waiting };
    })
  );

  res.json(stats);
}

const TREND_DAYS = 14;
const RATE_WINDOW_DAYS = 30;

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Builds an oldest-first array of the last `days` YYYY-MM-DD keys, so charts show empty days as zero instead of skipping them. */
function lastNDayKeys(days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    keys.push(dateKey(d));
  }
  return keys;
}

/**
 * Broader admin dashboard data: revenue and ticket volume trends, plus per-service
 * no-show rate and average time-to-call — computed in application code rather than SQL
 * date-trunc/avg to stay portable, which is fine at this app's data volume.
 */
export async function overview(_req: Request, res: Response) {
  const trendSince = new Date();
  trendSince.setDate(trendSince.getDate() - (TREND_DAYS - 1));
  trendSince.setHours(0, 0, 0, 0);

  const rateSince = new Date(Date.now() - RATE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [payments, tickets, rateWindowTickets, services] = await Promise.all([
    prisma.payment.findMany({
      where: { status: "SUCCESS", confirmedAt: { gte: trendSince } },
      select: { amount: true, confirmedAt: true },
    }),
    prisma.ticket.findMany({
      where: { createdAt: { gte: trendSince } },
      select: { createdAt: true },
    }),
    prisma.ticket.findMany({
      where: { createdAt: { gte: rateSince }, status: { in: ["COMPLETED", "NO_SHOW"] } },
      select: { serviceId: true, status: true, createdAt: true, calledAt: true },
    }),
    prisma.service.findMany({ where: { active: true }, select: { id: true, name: true } }),
  ]);

  const dayKeys = lastNDayKeys(TREND_DAYS);
  const revenueByDay = new Map(dayKeys.map((k) => [k, 0]));
  for (const p of payments) {
    const key = dateKey(p.confirmedAt!);
    if (revenueByDay.has(key)) revenueByDay.set(key, revenueByDay.get(key)! + p.amount);
  }

  const ticketsByDay = new Map(dayKeys.map((k) => [k, 0]));
  for (const t of tickets) {
    const key = dateKey(t.createdAt);
    if (ticketsByDay.has(key)) ticketsByDay.set(key, ticketsByDay.get(key)! + 1);
  }

  const perService = new Map(
    services.map((s) => [s.id, { serviceId: s.id, serviceName: s.name, completed: 0, noShow: 0, waitMinutesTotal: 0, waitSamples: 0 }])
  );
  for (const t of rateWindowTickets) {
    const bucket = perService.get(t.serviceId);
    if (!bucket) continue;
    if (t.status === "COMPLETED") bucket.completed += 1;
    if (t.status === "NO_SHOW") bucket.noShow += 1;
    if (t.calledAt) {
      bucket.waitMinutesTotal += (t.calledAt.getTime() - t.createdAt.getTime()) / 60000;
      bucket.waitSamples += 1;
    }
  }

  res.json({
    revenueByDay: dayKeys.map((date) => ({ date, amount: Math.round((revenueByDay.get(date) ?? 0) * 100) / 100 })),
    ticketsByDay: dayKeys.map((date) => ({ date, count: ticketsByDay.get(date) ?? 0 })),
    noShowRateByService: [...perService.values()].map((s) => ({
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      totalCalled: s.completed + s.noShow,
      noShowRatePct:
        s.completed + s.noShow > 0 ? Math.round((s.noShow / (s.completed + s.noShow)) * 1000) / 10 : 0,
    })),
    avgWaitMinutesByService: [...perService.values()].map((s) => ({
      serviceId: s.serviceId,
      serviceName: s.serviceName,
      avgWaitMin: s.waitSamples > 0 ? Math.round((s.waitMinutesTotal / s.waitSamples) * 10) / 10 : 0,
    })),
  });
}
