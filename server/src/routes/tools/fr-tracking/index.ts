import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { footfallUpsertSchema } from '@shared/validators';

export const frTrackingRouter: RouterType = Router();
frTrackingRouter.use(authenticate, requireToolAccess('floor.fr_tracking'));

// GET /positions — Staff positions / zone tracking
frTrackingRouter.get('/positions', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { tenantId };
    if (req.query['storeId']) where['storeId'] = req.query['storeId'];
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    // Return users as "positions" — the frontend uses this to map staff to zones
    res.json(users.map(u => ({ userId: u.id, userName: u.name, role: u.role })));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /stores
frTrackingRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };
    else if (tenantId) where['tenantId'] = tenantId;
    const stores = await prisma.store.findMany({ where, select: { id: true, name: true, city: true }, orderBy: { name: 'asc' } });
    res.json(stores);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /users
frTrackingRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /sessions — FR Sessions (uses FootfallEntry as session proxy)
frTrackingRouter.get('/sessions', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 30));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.staffId) where['enteredBy'] = req.query.staffId;
    if (req.query.from || req.query.to) {
      where['date'] = {};
      if (req.query.from) (where['date'] as Record<string, string>)['gte'] = req.query.from as string;
      if (req.query.to) (where['date'] as Record<string, string>)['lte'] = req.query.to as string;
    }

    const [data, total] = await Promise.all([
      prisma.footfallEntry.findMany({
        where,
        include: { store: { select: { id: true, name: true, city: true } } },
        orderBy: [{ date: 'desc' }, { hour: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.footfallEntry.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /analysis — Conversion trends, peaks, items analysis
frTrackingRouter.get('/analysis', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from || req.query.to) {
      where['date'] = {};
      if (req.query.from) (where['date'] as Record<string, string>)['gte'] = req.query.from as string;
      if (req.query.to) (where['date'] as Record<string, string>)['lte'] = req.query.to as string;
    }

    // Daily aggregates
    const dailyEntries = await prisma.footfallEntry.findMany({
      where: { ...where, hour: null },
      orderBy: { date: 'asc' },
      select: { date: true, footfall: true, revenue: true, transactions: true, conversionRate: true, storeId: true },
    });

    // Hourly entries for peak analysis
    const hourlyEntries = await prisma.footfallEntry.findMany({
      where: { ...where, hour: { not: null } },
      select: { hour: true, footfall: true, transactions: true, conversionRate: true },
    });

    // Conversion trend by date
    const byDate: Record<string, { footfall: number; transactions: number; revenue: number }> = {};
    for (const e of dailyEntries) {
      if (!byDate[e.date]) byDate[e.date] = { footfall: 0, transactions: 0, revenue: 0 };
      byDate[e.date]!.footfall += e.footfall;
      byDate[e.date]!.transactions += e.transactions;
      byDate[e.date]!.revenue += e.revenue;
    }
    const conversionTrend = Object.entries(byDate).map(([date, d]) => ({
      date,
      footfall: d.footfall,
      transactions: d.transactions,
      revenue: d.revenue,
      conversionRate: d.footfall > 0 ? Math.round((d.transactions / d.footfall) * 10000) / 100 : 0,
    }));

    // Peak hours heatmap
    const peakHours: Record<number, { footfall: number; transactions: number; count: number }> = {};
    for (const e of hourlyEntries) {
      const h = e.hour!;
      if (!peakHours[h]) peakHours[h] = { footfall: 0, transactions: 0, count: 0 };
      peakHours[h]!.footfall += e.footfall;
      peakHours[h]!.transactions += e.transactions;
      peakHours[h]!.count++;
    }
    const heatmap = Object.entries(peakHours).map(([hour, d]) => ({
      hour: Number(hour),
      avgFootfall: d.count > 0 ? Math.round(d.footfall / d.count) : 0,
      avgTransactions: d.count > 0 ? Math.round(d.transactions / d.count) : 0,
      avgConversion: d.footfall > 0 ? Math.round((d.transactions / d.footfall) * 10000) / 100 : 0,
    })).sort((a, b) => a.hour - b.hour);

    // Summary
    const totalFootfall = dailyEntries.reduce((s, e) => s + e.footfall, 0);
    const totalTransactions = dailyEntries.reduce((s, e) => s + e.transactions, 0);
    const totalRevenue = dailyEntries.reduce((s, e) => s + e.revenue, 0);
    const avgConversion = totalFootfall > 0 ? Math.round((totalTransactions / totalFootfall) * 10000) / 100 : 0;

    res.json({
      conversionTrend,
      heatmap,
      summary: { totalFootfall, totalTransactions, totalRevenue, avgConversion, dayCount: Object.keys(byDate).length },
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /staff-performance — Per staff metrics
frTrackingRouter.get('/staff-performance', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId, hour: null };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from || req.query.to) {
      where['date'] = {};
      if (req.query.from) (where['date'] as Record<string, string>)['gte'] = req.query.from as string;
      if (req.query.to) (where['date'] as Record<string, string>)['lte'] = req.query.to as string;
    }

    const entries = await prisma.footfallEntry.findMany({
      where,
      select: { enteredBy: true, footfall: true, transactions: true, revenue: true },
    });

    // Group by staff
    const byStaff: Record<string, { footfall: number; transactions: number; revenue: number; sessions: number }> = {};
    for (const e of entries) {
      if (!byStaff[e.enteredBy]) byStaff[e.enteredBy] = { footfall: 0, transactions: 0, revenue: 0, sessions: 0 };
      byStaff[e.enteredBy]!.footfall += e.footfall;
      byStaff[e.enteredBy]!.transactions += e.transactions;
      byStaff[e.enteredBy]!.revenue += e.revenue;
      byStaff[e.enteredBy]!.sessions++;
    }

    // Get user names
    const userIds = Object.keys(byStaff);
    const users = userIds.length > 0
      ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const totalFootfall = entries.reduce((s, e) => s + e.footfall, 0);
    const totalTransactions = entries.reduce((s, e) => s + e.transactions, 0);
    const teamAvgConversion = totalFootfall > 0 ? Math.round((totalTransactions / totalFootfall) * 10000) / 100 : 0;

    const staffPerformance = Object.entries(byStaff).map(([staffId, d]) => ({
      staffId,
      staffName: userMap.get(staffId) || 'Unbekannt',
      sessions: d.sessions,
      footfall: d.footfall,
      transactions: d.transactions,
      revenue: d.revenue,
      conversionRate: d.footfall > 0 ? Math.round((d.transactions / d.footfall) * 10000) / 100 : 0,
    })).sort((a, b) => b.conversionRate - a.conversionRate);

    res.json({ staffPerformance, teamAvgConversion });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /dashboard — Full analytics
frTrackingRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId, hour: null };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    // Last 30 days
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);
    const sinceStr = since30.toISOString().slice(0, 10);

    const recentEntries = await prisma.footfallEntry.findMany({
      where: { ...where, date: { gte: sinceStr } },
      include: { store: { select: { id: true, name: true } } },
      orderBy: { date: 'asc' },
    });

    // Today
    const today = new Date().toISOString().slice(0, 10);
    const todayEntries = recentEntries.filter((e) => e.date === today);
    const todayFootfall = todayEntries.reduce((s, e) => s + e.footfall, 0);
    const todayTransactions = todayEntries.reduce((s, e) => s + e.transactions, 0);
    const todayConversion = todayFootfall > 0 ? Math.round((todayTransactions / todayFootfall) * 10000) / 100 : 0;

    // Overall 30-day
    const totalFootfall = recentEntries.reduce((s, e) => s + e.footfall, 0);
    const totalTransactions = recentEntries.reduce((s, e) => s + e.transactions, 0);
    const totalRevenue = recentEntries.reduce((s, e) => s + e.revenue, 0);
    const avgConversion = totalFootfall > 0 ? Math.round((totalTransactions / totalFootfall) * 10000) / 100 : 0;

    // By day
    const byDay: Record<string, { footfall: number; transactions: number; revenue: number }> = {};
    for (const e of recentEntries) {
      if (!byDay[e.date]) byDay[e.date] = { footfall: 0, transactions: 0, revenue: 0 };
      byDay[e.date]!.footfall += e.footfall;
      byDay[e.date]!.transactions += e.transactions;
      byDay[e.date]!.revenue += e.revenue;
    }
    const dailyTrend = Object.entries(byDay).map(([date, d]) => ({
      date,
      ...d,
      conversionRate: d.footfall > 0 ? Math.round((d.transactions / d.footfall) * 10000) / 100 : 0,
    }));

    // Store comparison
    const byStore: Record<string, { name: string; footfall: number; transactions: number; revenue: number }> = {};
    for (const e of recentEntries) {
      const sid = e.storeId;
      if (!byStore[sid]) byStore[sid] = { name: e.store?.name || sid, footfall: 0, transactions: 0, revenue: 0 };
      byStore[sid]!.footfall += e.footfall;
      byStore[sid]!.transactions += e.transactions;
      byStore[sid]!.revenue += e.revenue;
    }
    const storeComparison = Object.entries(byStore).map(([storeId, d]) => ({
      storeId,
      storeName: d.name,
      footfall: d.footfall,
      transactions: d.transactions,
      revenue: d.revenue,
      conversionRate: d.footfall > 0 ? Math.round((d.transactions / d.footfall) * 10000) / 100 : 0,
    })).sort((a, b) => b.conversionRate - a.conversionRate);

    res.json({
      today: { footfall: todayFootfall, transactions: todayTransactions, conversion: todayConversion },
      period: { totalFootfall, totalTransactions, totalRevenue, avgConversion, days: Object.keys(byDay).length },
      dailyTrend,
      storeComparison,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// Legacy compat: GET /entries
frTrackingRouter.get('/entries', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 30));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.dateFrom || req.query.dateTo) {
      where['date'] = {};
      if (req.query.dateFrom) (where['date'] as Record<string, string>)['gte'] = req.query.dateFrom as string;
      if (req.query.dateTo) (where['date'] as Record<string, string>)['lte'] = req.query.dateTo as string;
    }

    const [data, total] = await Promise.all([
      prisma.footfallEntry.findMany({
        where,
        include: { store: { select: { id: true, name: true, city: true } } },
        orderBy: [{ date: 'desc' }, { hour: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.footfallEntry.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// Legacy compat: PUT /entries
frTrackingRouter.put('/entries', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = footfallUpsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const conversionRate = parsed.data.transactions && parsed.data.footfall
      ? Math.round((parsed.data.transactions / parsed.data.footfall) * 10000) / 100
      : null;
    const hourVal = parsed.data.hour ?? null;

    const entry = await prisma.footfallEntry.upsert({
      where: { storeId_date_hour: { storeId: parsed.data.storeId, date: parsed.data.date, hour: hourVal ?? -1 } },
      create: {
        tenantId,
        storeId: parsed.data.storeId,
        date: parsed.data.date,
        hour: hourVal,
        footfall: parsed.data.footfall,
        revenue: parsed.data.revenue ?? 0,
        transactions: parsed.data.transactions ?? 0,
        conversionRate,
        enteredBy: userId,
      },
      update: {
        footfall: parsed.data.footfall,
        revenue: parsed.data.revenue ?? 0,
        transactions: parsed.data.transactions ?? 0,
        conversionRate,
      },
      include: { store: { select: { id: true, name: true } } },
    });
    res.json(entry);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// Legacy compat: GET /summary
frTrackingRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { tenantId, hour: null };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.dateFrom || req.query.dateTo) {
      where['date'] = {};
      if (req.query.dateFrom) (where['date'] as Record<string, string>)['gte'] = req.query.dateFrom as string;
      if (req.query.dateTo) (where['date'] as Record<string, string>)['lte'] = req.query.dateTo as string;
    }

    const agg = await prisma.footfallEntry.aggregate({
      where,
      _sum: { footfall: true, revenue: true, transactions: true },
      _count: true,
    });

    const totalFootfall = agg._sum.footfall ?? 0;
    const totalTransactions = agg._sum.transactions ?? 0;
    const avgConversion = totalFootfall > 0 ? Math.round((totalTransactions / totalFootfall) * 10000) / 100 : 0;

    res.json({
      totalFootfall,
      totalRevenue: agg._sum.revenue ?? 0,
      totalTransactions,
      avgConversion,
      dayCount: agg._count,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// Legacy compat: GET /hourly
frTrackingRouter.get('/hourly', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    if (!req.query.storeId || !req.query.date) {
      return res.status(400).json({ error: 'storeId und date erforderlich.' });
    }
    const entries = await prisma.footfallEntry.findMany({
      where: { tenantId, storeId: req.query.storeId as string, date: req.query.date as string, hour: { not: null } },
      orderBy: { hour: 'asc' },
    });
    res.json(entries);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// Legacy compat: GET /trends
frTrackingRouter.get('/trends', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);

    const where: Record<string, unknown> = { tenantId, hour: null, date: { gte: sinceStr } };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const entries = await prisma.footfallEntry.findMany({
      where,
      orderBy: { date: 'asc' },
      select: { date: true, footfall: true, revenue: true, transactions: true, conversionRate: true },
    });

    const byDate: Record<string, { footfall: number; revenue: number; transactions: number }> = {};
    for (const e of entries) {
      if (!byDate[e.date]) byDate[e.date] = { footfall: 0, revenue: 0, transactions: 0 };
      byDate[e.date]!.footfall += e.footfall;
      byDate[e.date]!.revenue += e.revenue;
      byDate[e.date]!.transactions += e.transactions;
    }

    const trends = Object.entries(byDate).map(([date, data]) => ({
      date,
      ...data,
      conversionRate: data.footfall > 0 ? Math.round((data.transactions / data.footfall) * 10000) / 100 : 0,
    }));

    res.json(trends);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
