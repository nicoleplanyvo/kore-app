import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';

export const rmDashboardRouter: RouterType = Router();
rmDashboardRouter.use(authenticate, requireToolAccess('regional.rm_dashboard'));

// GET /stores — List accessible stores
rmDashboardRouter.get('/stores', async (req, res) => {
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

// GET /summary — Executive-level summary across all stores
rmDashboardRouter.get('/summary', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({ where: storeWhere, select: { id: true } });
    const storeIds = stores.map((s) => s.id);

    // KPI summary (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const kpis = await prisma.kpiEntry.findMany({
      where: { storeId: { in: storeIds }, date: { gte: sevenDaysAgo.toISOString().split('T')[0] } },
    });

    const totalRevenue = kpis.reduce((s, k) => s + k.revenue, 0);
    const totalTransactions = kpis.reduce((s, k) => s + (k.transactions ?? 0), 0);
    const totalFootfallKpi = kpis.reduce((s, k) => s + (k.footfall ?? 0), 0);

    // Footfall summary (last 7 days)
    const footfall = await prisma.footfallEntry.findMany({
      where: { storeId: { in: storeIds }, date: { gte: sevenDaysAgo.toISOString().split('T')[0] } },
    });
    const totalFootfall = footfall.reduce((s, f) => s + f.footfall, 0);

    // Open tasks counts
    const openMaintenance = await prisma.maintenanceRequest.count({
      where: { storeId: { in: storeIds }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
    });
    const openStockCallouts = await prisma.stockCallout.count({
      where: { storeId: { in: storeIds }, status: 'OPEN' },
    });
    const pendingOrders = await prisma.customerOrder.count({
      where: { storeId: { in: storeIds }, status: { in: ['ORDERED', 'SHIPPED', 'IN_TRANSIT'] } },
    });

    // Training completion rate
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { storeId: { in: storeIds } },
      select: { status: true },
    });
    const completedEnrollments = enrollments.filter((e) => e.status === 'COMPLETED').length;
    const trainingCompletionRate = enrollments.length > 0 ? Math.round((completedEnrollments / enrollments.length) * 100) : 0;

    res.json({
      storeCount: stores.length,
      kpi: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions,
        totalFootfallKpi,
      },
      totalFootfall,
      openMaintenance,
      openStockCallouts,
      pendingOrders,
      trainingCompletionRate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /alerts — Items needing attention
rmDashboardRouter.get('/alerts', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') storeWhere['storeId'] = { in: toolStoreIds };

    // Critical maintenance requests
    const criticalMaintenance = await prisma.maintenanceRequest.findMany({
      where: { ...storeWhere, priority: { in: ['HIGH', 'URGENT'] }, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      include: { store: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Critical stock callouts
    const criticalStock = await prisma.stockCallout.findMany({
      where: { ...storeWhere, urgency: { in: ['HIGH', 'CRITICAL'] }, status: 'OPEN' },
      include: { store: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const alerts = [
      ...criticalMaintenance.map((m) => ({
        type: 'MAINTENANCE' as const,
        severity: m.priority,
        title: m.title,
        store: m.store?.name ?? '—',
        createdAt: m.createdAt,
      })),
      ...criticalStock.map((sc) => ({
        type: 'STOCK' as const,
        severity: sc.urgency,
        title: `${sc.productName} (SKU: ${sc.sku})`,
        store: sc.store?.name ?? '—',
        createdAt: sc.createdAt,
      })),
    ];

    alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /trends — Weekly revenue trends across stores
rmDashboardRouter.get('/trends', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') storeWhere['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({ where: storeWhere, select: { id: true, name: true } });
    const storeIds = stores.map((s) => s.id);
    const weeks = Math.min(12, Math.max(1, Number(req.query.weeks) || 4));
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - weeks * 7);

    const kpis = await prisma.kpiEntry.findMany({
      where: {
        storeId: { in: storeIds },
        date: { gte: fromDate.toISOString().split('T')[0] },
      },
      orderBy: { date: 'asc' },
    });

    // Group by week
    const weeklyData: Record<string, { revenue: number; transactions: number; footfall: number; entries: number }> = {};
    for (const k of kpis) {
      const d = new Date(k.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1); // Monday
      const weekKey = weekStart.toISOString().split('T')[0] ?? '';

      if (!weeklyData[weekKey]) weeklyData[weekKey] = { revenue: 0, transactions: 0, footfall: 0, entries: 0 };
      const bucket = weeklyData[weekKey]!;
      bucket.revenue += k.revenue;
      bucket.transactions += k.transactions ?? 0;
      bucket.footfall += k.footfall ?? 0;
      bucket.entries += 1;
    }

    const trends = Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        revenue: Math.round(data.revenue * 100) / 100,
        transactions: data.transactions,
        footfall: data.footfall,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));

    res.json(trends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
