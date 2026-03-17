import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';

export const rmDashboardRouter: RouterType = Router();
rmDashboardRouter.use(authenticate, requireToolAccess('regional.rm_dashboard'));

// ── Helper: resolve accessible store IDs ─────────
async function resolveStoreIds(req: any): Promise<string[]> {
  const toolStoreIds = req.toolStoreIds as string[] | 'all';
  const storeWhere: Record<string, unknown> = {};
  if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };
  const stores = await prisma.store.findMany({ where: storeWhere, select: { id: true } });
  return stores.map((s) => s.id);
}

function getDateRange(from?: string, to?: string, period?: string): { from?: string; to?: string } {
  if (from || to) return { from: from || undefined, to: to || undefined };
  const now = new Date();
  const toStr = now.toISOString().split('T')[0];
  switch (period) {
    case 'today':
      return { from: toStr, to: toStr };
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return { from: d.toISOString().split('T')[0], to: toStr };
    }
    case 'year': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return { from: d.toISOString().split('T')[0], to: toStr };
    }
    case 'quarter': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 3);
      return { from: d.toISOString().split('T')[0], to: toStr };
    }
    case 'month':
    default: {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return { from: d.toISOString().split('T')[0], to: toStr };
    }
  }
}

// ── GET /stores — List accessible stores ─────────
rmDashboardRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where,
      select: { id: true, name: true, city: true, region: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /summary — Executive summary across stores ─────
rmDashboardRouter.get('/summary', async (req, res) => {
  try {
    const storeIds = await resolveStoreIds(req);
    const range = getDateRange(
      req.query.from as string | undefined,
      req.query.to as string | undefined,
      (req.query.period as string) || 'week',
    );

    // Previous period for comparison
    const fromDate = range.from ? new Date(range.from) : new Date();
    const toDate = range.to ? new Date(range.to) : new Date();
    const daysDiff = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) || 7;
    const prevFrom = new Date(fromDate);
    prevFrom.setDate(prevFrom.getDate() - daysDiff);
    const prevTo = new Date(fromDate);
    prevTo.setDate(prevTo.getDate() - 1);

    const kpiWhere: Record<string, unknown> = { storeId: { in: storeIds } };
    if (range.from) kpiWhere['date'] = { ...(kpiWhere['date'] as any || {}), gte: range.from };
    if (range.to) kpiWhere['date'] = { ...(kpiWhere['date'] as any || {}), lte: range.to };

    const prevKpiWhere: Record<string, unknown> = {
      storeId: { in: storeIds },
      date: { gte: prevFrom.toISOString().split('T')[0], lte: prevTo.toISOString().split('T')[0] },
    };

    const [kpis, prevKpis, footfall, prevFootfall, stores] = await Promise.all([
      prisma.kpiEntry.findMany({ where: kpiWhere }),
      prisma.kpiEntry.findMany({ where: prevKpiWhere }),
      prisma.footfallEntry.findMany({
        where: {
          storeId: { in: storeIds },
          ...(range.from ? { date: { gte: range.from, ...(range.to ? { lte: range.to } : {}) } } : {}),
        },
      }),
      prisma.footfallEntry.findMany({
        where: {
          storeId: { in: storeIds },
          date: { gte: prevFrom.toISOString().split('T')[0], lte: prevTo.toISOString().split('T')[0] },
        },
      }),
      prisma.store.findMany({ where: { id: { in: storeIds }, isActive: true }, select: { id: true } }),
    ]);

    const totalRevenue = kpis.reduce((s, k) => s + k.revenue, 0);
    const prevRevenue = prevKpis.reduce((s, k) => s + k.revenue, 0);
    const totalTransactions = kpis.reduce((s, k) => s + (k.transactions ?? 0), 0);
    const prevTransactions = prevKpis.reduce((s, k) => s + (k.transactions ?? 0), 0);
    const totalFootfall = footfall.reduce((s, f) => s + f.footfall, 0);
    const prevTotalFootfall = prevFootfall.reduce((s, f) => s + f.footfall, 0);
    const totalUnitsSold = kpis.reduce((s, k) => s + (k.unitsSold ?? 0), 0);
    const avgConversionRate = totalFootfall > 0 ? Math.round((totalTransactions / totalFootfall) * 10000) / 100 : 0;
    const avgTicket = totalTransactions > 0 ? Math.round((totalRevenue / totalTransactions) * 100) / 100 : 0;

    // Compute changes
    const revenueChange = prevRevenue > 0 ? Math.round(((totalRevenue - prevRevenue) / prevRevenue) * 1000) / 10 : 0;
    const transactionChange = prevTransactions > 0 ? Math.round(((totalTransactions - prevTransactions) / prevTransactions) * 1000) / 10 : 0;
    const footfallChange = prevTotalFootfall > 0 ? Math.round(((totalFootfall - prevTotalFootfall) / prevTotalFootfall) * 1000) / 10 : 0;

    // Operational counts
    const [openMaintenance, openStockCallouts, pendingOrders, openLossIncidents, enrollments] = await Promise.all([
      prisma.maintenanceRequest.count({
        where: { storeId: { in: storeIds }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      prisma.stockCallout.count({
        where: { storeId: { in: storeIds }, status: 'OPEN' },
      }),
      prisma.customerOrder.count({
        where: { storeId: { in: storeIds }, status: { in: ['ORDERED', 'SHIPPED', 'IN_TRANSIT'] } },
      }),
      prisma.lossIncident.count({
        where: { storeId: { in: storeIds }, status: { in: ['OPEN', 'INVESTIGATING'] } },
      }),
      prisma.courseEnrollment.findMany({
        where: { storeId: { in: storeIds } },
        select: { status: true },
      }),
    ]);

    const completedEnrollments = enrollments.filter((e) => e.status === 'COMPLETED').length;
    const trainingCompletionRate = enrollments.length > 0 ? Math.round((completedEnrollments / enrollments.length) * 100) : 0;

    res.json({
      storeCount: stores.length,
      period: { from: range.from, to: range.to, days: daysDiff },
      kpi: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        totalFootfall,
        totalUnitsSold,
        avgConversionRate,
        avgTicket,
        revenueChange,
        transactionChange,
        footfallChange,
      },
      operational: {
        openMaintenance,
        openStockCallouts,
        pendingOrders,
        openLossIncidents,
        trainingCompletionRate,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /ranking — Store ranking by KPI ──────────
rmDashboardRouter.get('/ranking', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: { id: true, name: true, city: true },
    });
    const storeIds = stores.map((s) => s.id);

    const range = getDateRange(
      req.query.from as string | undefined,
      req.query.to as string | undefined,
      (req.query.period as string) || 'month',
    );
    const kpiField = (req.query.kpi as string) || 'revenue'; // revenue, transactions, footfall, conversionRate, avgTicket

    const kpiWhere: Record<string, unknown> = { storeId: { in: storeIds } };
    if (range.from) kpiWhere['date'] = { ...(kpiWhere['date'] as any || {}), gte: range.from };
    if (range.to) kpiWhere['date'] = { ...(kpiWhere['date'] as any || {}), lte: range.to };

    const kpis = await prisma.kpiEntry.findMany({ where: kpiWhere });

    // Also load footfall for conversion rate calc
    const footfallEntries = await prisma.footfallEntry.findMany({
      where: {
        storeId: { in: storeIds },
        ...(range.from ? { date: { gte: range.from, ...(range.to ? { lte: range.to } : {}) } } : {}),
      },
    });

    const storeMap = new Map<string, {
      revenue: number; transactions: number; footfall: number;
      unitsSold: number; entries: number;
    }>();

    for (const k of kpis) {
      const existing = storeMap.get(k.storeId) || { revenue: 0, transactions: 0, footfall: 0, unitsSold: 0, entries: 0 };
      existing.revenue += k.revenue;
      existing.transactions += k.transactions ?? 0;
      existing.unitsSold += k.unitsSold ?? 0;
      existing.entries++;
      storeMap.set(k.storeId, existing);
    }

    // Add footfall from FootfallEntry
    for (const f of footfallEntries) {
      const existing = storeMap.get(f.storeId) || { revenue: 0, transactions: 0, footfall: 0, unitsSold: 0, entries: 0 };
      existing.footfall += f.footfall;
      storeMap.set(f.storeId, existing);
    }

    const ranking = stores.map((store) => {
      const data = storeMap.get(store.id) || { revenue: 0, transactions: 0, footfall: 0, unitsSold: 0, entries: 0 };
      const conversionRate = data.footfall > 0 ? Math.round((data.transactions / data.footfall) * 10000) / 100 : 0;
      const avgTicket = data.transactions > 0 ? Math.round((data.revenue / data.transactions) * 100) / 100 : 0;

      let sortValue = 0;
      switch (kpiField) {
        case 'revenue': sortValue = data.revenue; break;
        case 'transactions': sortValue = data.transactions; break;
        case 'footfall': sortValue = data.footfall; break;
        case 'conversionRate': sortValue = conversionRate; break;
        case 'avgTicket': sortValue = avgTicket; break;
        case 'unitsSold': sortValue = data.unitsSold; break;
        default: sortValue = data.revenue;
      }

      return {
        storeId: store.id,
        storeName: store.name,
        city: store.city,
        revenue: Math.round(data.revenue * 100) / 100,
        transactions: data.transactions,
        footfall: data.footfall,
        unitsSold: data.unitsSold,
        conversionRate,
        avgTicket,
        sortValue,
      };
    });

    ranking.sort((a, b) => b.sortValue - a.sortValue);

    // Compute traffic light (Ampel): top 33% green, middle 33% yellow, bottom 33% red
    const maxVal = ranking.length > 0 ? ranking[0]!.sortValue : 0;
    const threshold66 = maxVal * 0.66;
    const threshold33 = maxVal * 0.33;
    const ranked = ranking.map((r, i) => ({
      ...r,
      rank: i + 1,
      status: r.sortValue >= threshold66 ? 'green' : r.sortValue >= threshold33 ? 'yellow' : 'red',
    }));

    res.json(ranked);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /store/:storeId — Store detail / drill-down ──
rmDashboardRouter.get('/store/:storeId', async (req, res) => {
  try {
    const { storeId } = req.params;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    if (toolStoreIds !== 'all' && !toolStoreIds.includes(storeId)) {
      return res.status(403).json({ error: 'Kein Zugriff auf diesen Store.' });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, city: true, address: true, region: { select: { id: true, name: true } } },
    });
    if (!store) return res.status(404).json({ error: 'Store nicht gefunden.' });

    const range = getDateRange(
      req.query.from as string | undefined,
      req.query.to as string | undefined,
      (req.query.period as string) || 'month',
    );

    const kpiWhere: Record<string, unknown> = { storeId };
    if (range.from) kpiWhere['date'] = { ...(kpiWhere['date'] as any || {}), gte: range.from };
    if (range.to) kpiWhere['date'] = { ...(kpiWhere['date'] as any || {}), lte: range.to };

    const [kpis, footfall, openMaintenance, openStock, lossIncidents, enrollments, forecasts] = await Promise.all([
      prisma.kpiEntry.findMany({ where: kpiWhere, orderBy: { date: 'asc' } }),
      prisma.footfallEntry.findMany({
        where: {
          storeId,
          ...(range.from ? { date: { gte: range.from, ...(range.to ? { lte: range.to } : {}) } } : {}),
        },
        orderBy: { date: 'asc' },
      }),
      prisma.maintenanceRequest.findMany({
        where: { storeId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        select: { id: true, title: true, priority: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.stockCallout.findMany({
        where: { storeId, status: 'OPEN' },
        select: { id: true, productName: true, sku: true, urgency: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.lossIncident.findMany({
        where: {
          storeId,
          status: { in: ['OPEN', 'INVESTIGATING'] },
        },
        select: { id: true, category: true, amount: true, severity: true, status: true, incidentDate: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.courseEnrollment.findMany({
        where: { storeId },
        select: { status: true },
      }),
      prisma.forecast.findMany({
        where: {
          storeId,
          ...(range.from ? { period: { gte: range.from, ...(range.to ? { lte: range.to } : {}) } } : {}),
        },
        orderBy: { period: 'desc' },
        take: 20,
      }),
    ]);

    // Aggregate KPIs
    const totalRevenue = kpis.reduce((s, k) => s + k.revenue, 0);
    const totalTransactions = kpis.reduce((s, k) => s + (k.transactions ?? 0), 0);
    const totalFootfall = footfall.reduce((s, f) => s + f.footfall, 0);
    const totalUnitsSold = kpis.reduce((s, k) => s + (k.unitsSold ?? 0), 0);
    const conversionRate = totalFootfall > 0 ? Math.round((totalTransactions / totalFootfall) * 10000) / 100 : 0;
    const avgTicket = totalTransactions > 0 ? Math.round((totalRevenue / totalTransactions) * 100) / 100 : 0;

    // Daily trend
    const dailyMap = new Map<string, { revenue: number; transactions: number; footfall: number }>();
    for (const k of kpis) {
      const existing = dailyMap.get(k.date) || { revenue: 0, transactions: 0, footfall: 0 };
      existing.revenue += k.revenue;
      existing.transactions += k.transactions ?? 0;
      dailyMap.set(k.date, existing);
    }
    for (const f of footfall) {
      const existing = dailyMap.get(f.date) || { revenue: 0, transactions: 0, footfall: 0 };
      existing.footfall += f.footfall;
      dailyMap.set(f.date, existing);
    }

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, d]) => ({ date, ...d }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Training
    const completedEnrollments = enrollments.filter((e) => e.status === 'COMPLETED').length;
    const trainingRate = enrollments.length > 0 ? Math.round((completedEnrollments / enrollments.length) * 100) : 0;

    // Forecast accuracy
    const forecastsWithActual = forecasts.filter((f) => f.actualValue !== null);
    const avgAccuracy = forecastsWithActual.length > 0
      ? Math.round(forecastsWithActual.reduce((s, f) => {
          const dev = f.forecastValue > 0 ? Math.abs((f.actualValue! - f.forecastValue) / f.forecastValue * 100) : 0;
          return s + Math.max(0, 100 - dev);
        }, 0) / forecastsWithActual.length)
      : null;

    res.json({
      store,
      period: range,
      kpi: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        totalFootfall,
        totalUnitsSold,
        conversionRate,
        avgTicket,
      },
      dailyTrend,
      operational: {
        openMaintenance,
        openStock,
        lossIncidents,
        trainingRate,
        forecastAccuracy: avgAccuracy,
      },
      recentForecasts: forecasts.slice(0, 5),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /alerts — Critical items needing attention ──
rmDashboardRouter.get('/alerts', async (req, res) => {
  try {
    const storeIds = await resolveStoreIds(req);
    const storeWhere = { storeId: { in: storeIds } };

    const [criticalMaintenance, criticalStock, criticalLoss] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where: { ...storeWhere, priority: { in: ['HIGH', 'URGENT'] }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
        include: { store: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      prisma.stockCallout.findMany({
        where: { ...storeWhere, urgency: { in: ['HIGH', 'CRITICAL'] }, status: 'OPEN' },
        include: { store: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 15,
      }),
      prisma.lossIncident.findMany({
        where: { ...storeWhere, severity: { in: ['HIGH', 'CRITICAL'] }, status: { in: ['OPEN', 'INVESTIGATING'] } },
        include: { store: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const alerts = [
      ...criticalMaintenance.map((m) => ({
        type: 'MAINTENANCE' as const,
        severity: m.priority,
        title: m.title,
        storeId: m.store?.id ?? '',
        store: m.store?.name ?? '--',
        status: m.status,
        createdAt: m.createdAt,
      })),
      ...criticalStock.map((sc) => ({
        type: 'STOCK' as const,
        severity: sc.urgency,
        title: `${sc.productName} (SKU: ${sc.sku})`,
        storeId: sc.store?.id ?? '',
        store: sc.store?.name ?? '--',
        status: sc.status,
        createdAt: sc.createdAt,
      })),
      ...criticalLoss.map((l) => ({
        type: 'LOSS' as const,
        severity: l.severity,
        title: `${l.category}: ${l.amount.toFixed(2)} EUR`,
        storeId: l.store?.id ?? '',
        store: l.store?.name ?? '--',
        status: l.status,
        createdAt: l.createdAt,
      })),
    ];

    alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /trends — Weekly aggregated trends ───────
rmDashboardRouter.get('/trends', async (req, res) => {
  try {
    const storeIds = await resolveStoreIds(req);
    const weeks = Math.min(12, Math.max(1, Number(req.query.weeks) || 4));
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - weeks * 7);

    const [kpis, footfallEntries] = await Promise.all([
      prisma.kpiEntry.findMany({
        where: { storeId: { in: storeIds }, date: { gte: fromDate.toISOString().split('T')[0] } },
        orderBy: { date: 'asc' },
      }),
      prisma.footfallEntry.findMany({
        where: { storeId: { in: storeIds }, date: { gte: fromDate.toISOString().split('T')[0] } },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Group by week
    const weeklyData: Record<string, { revenue: number; transactions: number; footfall: number; unitsSold: number }> = {};
    for (const k of kpis) {
      const d = new Date(k.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1); // Monday
      const weekKey = weekStart.toISOString().split('T')[0] ?? '';

      if (!weeklyData[weekKey]) weeklyData[weekKey] = { revenue: 0, transactions: 0, footfall: 0, unitsSold: 0 };
      const bucket = weeklyData[weekKey]!;
      bucket.revenue += k.revenue;
      bucket.transactions += k.transactions ?? 0;
      bucket.unitsSold += k.unitsSold ?? 0;
    }

    for (const f of footfallEntries) {
      const d = new Date(f.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const weekKey = weekStart.toISOString().split('T')[0] ?? '';

      if (!weeklyData[weekKey]) weeklyData[weekKey] = { revenue: 0, transactions: 0, footfall: 0, unitsSold: 0 };
      weeklyData[weekKey]!.footfall += f.footfall;
    }

    const trends = Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        revenue: Math.round(data.revenue * 100) / 100,
        transactions: data.transactions,
        footfall: data.footfall,
        unitsSold: data.unitsSold,
        conversionRate: data.footfall > 0 ? Math.round((data.transactions / data.footfall) * 10000) / 100 : 0,
        avgTicket: data.transactions > 0 ? Math.round((data.revenue / data.transactions) * 100) / 100 : 0,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    res.json(trends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /export — CSV export of store data ───────
rmDashboardRouter.get('/export', async (req, res) => {
  try {
    const storeIds = await resolveStoreIds(req);
    const range = getDateRange(
      req.query.from as string | undefined,
      req.query.to as string | undefined,
      (req.query.period as string) || 'month',
    );

    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, name: true, city: true },
    });

    const kpiWhere: Record<string, unknown> = { storeId: { in: storeIds } };
    if (range.from) kpiWhere['date'] = { ...(kpiWhere['date'] as any || {}), gte: range.from };
    if (range.to) kpiWhere['date'] = { ...(kpiWhere['date'] as any || {}), lte: range.to };

    const kpis = await prisma.kpiEntry.findMany({ where: kpiWhere, orderBy: { date: 'asc' } });

    const storeNameMap = new Map(stores.map((s) => [s.id, `${s.name}${s.city ? ` (${s.city})` : ''}`]));

    const rows = kpis.map((k) => ({
      store: storeNameMap.get(k.storeId) ?? k.storeId,
      date: k.date,
      revenue: k.revenue,
      transactions: k.transactions,
      footfall: k.footfall ?? 0,
      unitsSold: k.unitsSold ?? 0,
    }));

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
