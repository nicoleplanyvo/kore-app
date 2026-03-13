/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';

export const multiStoreRouter: RouterType = Router();
multiStoreRouter.use(authenticate, requireToolAccess('regional.multi_store_view'));

// GET /stores — List accessible stores with basic info
multiStoreRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where,
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /overview — Aggregated data per store (KPIs, footfall, maintenance)
multiStoreRouter.get('/overview', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });

    const storeIds = stores.map((s) => s.id);

    // Latest KPI per store
    const kpiEntries = await prisma.kpiEntry.findMany({
      where: { storeId: { in: storeIds } },
      orderBy: { date: 'desc' },
    });

    const latestKpi: Record<string, (typeof kpiEntries)[0]> = {};
    for (const k of kpiEntries) {
      if (!latestKpi[k.storeId]) latestKpi[k.storeId] = k;
    }

    // Footfall summary (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const footfallEntries = await prisma.footfallEntry.findMany({
      where: {
        storeId: { in: storeIds },
        date: { gte: sevenDaysAgo.toISOString().split('T')[0] },
      },
    });

    const footfallByStore: Record<string, { totalFootfall: number; totalRevenue: number; totalTransactions: number }> = {};
    for (const f of footfallEntries) {
      const sid = f.storeId;
      if (!footfallByStore[sid]) footfallByStore[sid] = { totalFootfall: 0, totalRevenue: 0, totalTransactions: 0 };
      const bucket = footfallByStore[sid]!;
      bucket.totalFootfall += f.footfall;
      bucket.totalRevenue += f.revenue;
      bucket.totalTransactions += f.transactions;
    }

    // Open maintenance requests per store
    const maintenanceOpen = await prisma.maintenanceRequest.groupBy({
      by: ['storeId'],
      where: { storeId: { in: storeIds }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      _count: { id: true },
    });
    const maintenanceMap: Record<string, number> = {};
    for (const m of maintenanceOpen) {
      maintenanceMap[m.storeId] = m._count.id;
    }

    const overview = stores.map((s) => {
      const kpi = latestKpi[s.id];
      return {
        storeId: s.id,
        storeName: s.name,
        city: s.city,
        kpi: kpi
          ? {
              revenue: kpi.revenue,
              transactions: kpi.transactions,
              footfall: kpi.footfall,
              unitsSold: kpi.unitsSold,
              date: kpi.date,
            }
          : null,
        footfall7d: footfallByStore[s.id] ?? { totalFootfall: 0, totalRevenue: 0, totalTransactions: 0 },
        openMaintenance: maintenanceMap[s.id] ?? 0,
      };
    });

    res.json(overview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /comparison — Side-by-side KPI comparison
multiStoreRouter.get('/comparison', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const storeIds = stores.map((s) => s.id);
    const period = (req.query.period as string) || '7d';
    const days = period === '30d' ? 30 : period === '14d' ? 14 : 7;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const kpiEntries = await prisma.kpiEntry.findMany({
      where: {
        storeId: { in: storeIds },
        date: { gte: fromDate.toISOString().split('T')[0] },
      },
    });

    const groupByStore: Record<string, any[]> = {};
    for (const k of kpiEntries) {
      if (!groupByStore[k.storeId]) groupByStore[k.storeId] = [];
      groupByStore[k.storeId]!.push(k);
    }

    const storeMap = Object.fromEntries(stores.map((s) => [s.id, s.name]));

    const comparison = Object.entries(groupByStore).map(([storeId, entries]) => {
      const totalRevenue = entries.reduce((s: number, e: any) => s + e.revenue, 0);
      const totalTransactions = entries.reduce((s: number, e: any) => s + (e.transactions ?? 0), 0);
      const totalFootfall = entries.reduce((s: number, e: any) => s + (e.footfall ?? 0), 0);
      const totalUnitsSold = entries.reduce((s: number, e: any) => s + (e.unitsSold ?? 0), 0);
      const avgRevenuePerDay = entries.length > 0 ? totalRevenue / entries.length : 0;
      return {
        storeId,
        storeName: storeMap[storeId] ?? storeId,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        totalFootfall,
        totalUnitsSold,
        avgRevenuePerDay: Math.round(avgRevenuePerDay * 100) / 100,
        dataPoints: entries.length,
      };
    });

    comparison.sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json(comparison);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /ranking — Store ranking by metric
multiStoreRouter.get('/ranking', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: { id: true, name: true, city: true },
    });

    const storeIds = stores.map((s) => s.id);
    const metric = (req.query.metric as string) || 'revenue';

    // Last 30 days of KPIs
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);

    const kpiEntries = await prisma.kpiEntry.findMany({
      where: {
        storeId: { in: storeIds },
        date: { gte: fromDate.toISOString().split('T')[0] },
      },
    });

    const rankGroupByStore: Record<string, any[]> = {};
    for (const k of kpiEntries) {
      if (!rankGroupByStore[k.storeId]) rankGroupByStore[k.storeId] = [];
      rankGroupByStore[k.storeId]!.push(k);
    }

    const storeMap = Object.fromEntries(stores.map((s) => [s.id, s]));

    const rankings = Object.entries(rankGroupByStore).map(([storeId, entries]) => {
      let value = 0;
      if (metric === 'revenue') value = entries.reduce((s: number, e: any) => s + e.revenue, 0);
      else if (metric === 'transactions') value = entries.reduce((s: number, e: any) => s + (e.transactions ?? 0), 0);
      else if (metric === 'footfall') value = entries.reduce((s: number, e: any) => s + (e.footfall ?? 0), 0);
      else if (metric === 'unitsSold') value = entries.reduce((s: number, e: any) => s + (e.unitsSold ?? 0), 0);

      const store = storeMap[storeId] as any;
      return {
        storeId,
        storeName: store?.name ?? storeId,
        city: store?.city ?? '',
        metric,
        value: Math.round(value * 100) / 100,
        rank: 0,
      };
    });

    rankings.sort((a, b) => b.value - a.value);
    rankings.forEach((r, i) => { r.rank = i + 1; });

    res.json(rankings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
