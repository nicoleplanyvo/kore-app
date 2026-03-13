import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { footfallUpsertSchema } from '@shared/validators';

export const frTrackingRouter: RouterType = Router();
frTrackingRouter.use(authenticate, requireToolAccess('floor.fr_tracking'));

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

// GET /entries — Paginiert mit Filtern
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

// PUT /entries — Upsert (storeId + date + hour unique)
frTrackingRouter.put('/entries', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string ?? req.user!.sub;
    const parsed = footfallUpsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

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

// GET /summary — Aggregierte Kennzahlen
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

// GET /hourly — Stündliche Daten für einen Tag
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

// GET /trends — Tägliche Trends der letzten N Tage
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

    // Gruppiere nach Datum
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
