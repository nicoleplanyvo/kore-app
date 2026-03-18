import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';

export const myDayRouter: RouterType = Router();
myDayRouter.use(authenticate);

/**
 * GET /api/tools/my-day
 *
 * "Mein Tag" — Die Startseite fuer Store Manager.
 * Buendelt alle relevanten Infos in einem Aufruf:
 * - Heutige Checklisten (offen / erledigt)
 * - Ueberfaellige Checklisten
 * - KPI-Zahlen von gestern
 * - Heutige Schichten + wer ist da
 * - Offene Handovers zum Bestaetigen
 * - Ungelesene Briefings
 * - Anstehende Coaching-Sessions
 * - Live Floor Status
 */
myDayRouter.get('/', async (req, res) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.sub;

    if (!tenantId) {
      return res.status(403).json({ error: 'Kein Tenant zugewiesen.' });
    }

    // Zeitbereiche
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const todayStr = todayStart.toISOString().slice(0, 10);
    const yesterdayStr = yesterdayStart.toISOString().slice(0, 10);

    // Stores des Users ermitteln
    const userStores = await prisma.userStoreAssignment.findMany({
      where: { userId },
      select: { storeId: true, store: { select: { id: true, name: true } } },
    });
    const storeIds = userStores.map(s => s.storeId);
    const storeFilter = storeIds.length > 0 ? { storeId: { in: storeIds } } : {};

    // ── 1. Checklisten heute ─────────────────────
    const [todayChecklists, todayCompleted, overdueChecklists] = await Promise.all([
      prisma.checklistSession.count({
        where: { tenantId, ...storeFilter, startedAt: { gte: todayStart, lt: todayEnd } },
      }),
      prisma.checklistSession.count({
        where: { tenantId, ...storeFilter, startedAt: { gte: todayStart, lt: todayEnd }, status: 'COMPLETED' },
      }),
      prisma.checklistSession.findMany({
        where: { tenantId, ...storeFilter, status: 'IN_PROGRESS' },
        include: {
          template: { select: { name: true } },
          store: { select: { name: true } },
        },
        orderBy: { startedAt: 'asc' },
        take: 10,
      }),
    ]);

    // ── 2. KPIs gestern ──────────────────────────
    const yesterdayKpis = await prisma.kpiEntry.findMany({
      where: { tenantId, ...storeFilter, date: yesterdayStr },
      include: { store: { select: { id: true, name: true } } },
    });

    const kpiSummary = {
      revenue: yesterdayKpis.reduce((s, e) => s + e.revenue, 0),
      transactions: yesterdayKpis.reduce((s, e) => s + e.transactions, 0),
      footfall: yesterdayKpis.reduce((s, e) => s + (e.footfall ?? 0), 0),
      unitsSold: yesterdayKpis.reduce((s, e) => s + (e.unitsSold ?? 0), 0),
      date: yesterdayStr,
    };
    // ATV berechnen
    const atv = kpiSummary.transactions > 0
      ? Math.round((kpiSummary.revenue / kpiSummary.transactions) * 100) / 100
      : 0;
    // Conversion berechnen
    const conversion = kpiSummary.footfall > 0
      ? Math.round((kpiSummary.transactions / kpiSummary.footfall) * 10000) / 100
      : 0;
    // UPT berechnen
    const upt = kpiSummary.transactions > 0
      ? Math.round((kpiSummary.unitsSold / kpiSummary.transactions) * 100) / 100
      : 0;

    // ── 3. Schichten heute ───────────────────────
    const todayShifts = await prisma.shiftEntry.findMany({
      where: { ...storeFilter, date: { gte: todayStart, lt: todayEnd } },
      include: {
        user: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    // ── 4. Offene Handovers ──────────────────────
    const pendingHandovers = await prisma.handover.findMany({
      where: { ...storeFilter, status: 'SUBMITTED' },
      include: {
        fromUser: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // ── 5. Ungelesene Briefings ──────────────────
    const recentBriefings = await prisma.briefing.findMany({
      where: {
        ...storeFilter,
        publishedAt: { not: null },
        date: { gte: yesterdayStr },
      },
      include: {
        store: { select: { id: true, name: true } },
        acknowledgments: { where: { userId }, select: { id: true } },
      },
      orderBy: { date: 'desc' },
      take: 5,
    });

    const unreadBriefings = recentBriefings.filter(b => b.acknowledgments.length === 0);

    // ── 6. Coaching-Sessions heute ───────────────
    const todayCoaching = await prisma.coachingSession.findMany({
      where: {
        tenantId,
        ...storeFilter,
        scheduledAt: { gte: todayStart, lt: todayEnd },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      include: {
        coachee: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // ── 7. Live Floor Snapshot ───────────────────
    let floorSnapshot = null;
    if (storeIds.length > 0) {
      const zones = await prisma.floorZone.findMany({
        where: { storeId: { in: storeIds }, isActive: true },
        include: {
          positions: { where: { endedAt: null }, select: { id: true, status: true } },
        },
      });
      const totalStaff = zones.reduce((s, z) => s + z.positions.length, 0);
      const totalCustomers = zones.reduce((s, z) => s + z.customerCount, 0);
      const underStaffed = zones.filter(z => z.positions.filter(p => p.status === 'ON_FLOOR').length < z.minStaff).length;
      floorSnapshot = { totalZones: zones.length, totalStaff, totalCustomers, underStaffedZones: underStaffed };
    }

    // ── 8. Pending Swap Requests ─────────────────
    const pendingSwaps = await prisma.shiftSwapRequest.count({
      where: { shiftEntry: { ...storeFilter }, status: 'PENDING' },
    });

    // ── Antwort ──────────────────────────────────
    res.json({
      greeting: getGreeting(),
      date: todayStr,
      stores: userStores.map(s => s.store),

      checklists: {
        todayTotal: todayChecklists,
        todayCompleted,
        todayRate: todayChecklists > 0 ? Math.round((todayCompleted / todayChecklists) * 100) : 0,
        overdue: overdueChecklists.map(c => ({
          id: c.id,
          template: c.template.name,
          store: c.store.name,
          startedAt: c.startedAt,
        })),
      },

      kpiYesterday: {
        ...kpiSummary,
        atv,
        conversion,
        upt,
        storeCount: yesterdayKpis.length,
        perStore: yesterdayKpis.map(e => ({
          storeId: e.storeId,
          storeName: e.store.name,
          revenue: e.revenue,
          transactions: e.transactions,
          atv: e.transactions > 0 ? Math.round((e.revenue / e.transactions) * 100) / 100 : 0,
        })),
      },

      shifts: {
        today: todayShifts.map(s => ({
          id: s.id,
          user: s.user?.name ?? 'N/A',
          store: s.store?.name ?? 'N/A',
          start: s.startTime,
          end: s.endTime,
          status: s.status,
        })),
        totalToday: todayShifts.length,
        pendingSwaps,
      },

      handovers: {
        pending: pendingHandovers.map(h => ({
          id: h.id,
          from: h.fromUser?.name ?? 'N/A',
          store: h.store?.name ?? 'N/A',
          shiftDate: h.shiftDate,
          createdAt: h.createdAt,
        })),
      },

      briefings: {
        unread: unreadBriefings.map(b => ({
          id: b.id,
          title: b.title,
          date: b.date,
          store: b.store?.name ?? 'N/A',
        })),
      },

      coaching: {
        today: todayCoaching.map(c => ({
          id: c.id,
          coachee: c.coachee?.name ?? 'N/A',
          store: c.store?.name ?? 'N/A',
          time: c.scheduledAt,
          topic: c.topic,
        })),
      },

      floor: floorSnapshot,
    });
  } catch (err) {
    console.error('My Day dashboard error:', err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Guten Morgen';
  if (hour < 17) return 'Guten Tag';
  return 'Guten Abend';
}
