import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { kpiEntryUpsertSchema } from '@shared/validators';

export const kpiDashboardRouter: RouterType = Router();
kpiDashboardRouter.use(authenticate, requireToolAccess('performance.kpi_dashboard'));

// GET /stores
kpiDashboardRouter.get('/stores', async (req, res) => {
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

// GET /entries — Paginiert mit Filter (storeId, dateFrom, dateTo)
kpiDashboardRouter.get('/entries', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 30));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (toolStoreIds !== 'all') where['storeId'] = req.query.storeId || { in: toolStoreIds };
    if (req.query.dateFrom || req.query.dateTo) {
      where['date'] = {};
      if (req.query.dateFrom) (where['date'] as Record<string, string>)['gte'] = req.query.dateFrom as string;
      if (req.query.dateTo) (where['date'] as Record<string, string>)['lte'] = req.query.dateTo as string;
    }

    const [data, total] = await Promise.all([
      prisma.kpiEntry.findMany({
        where,
        include: { store: { select: { id: true, name: true, city: true } } },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.kpiEntry.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /entries — Upsert (storeId + date unique)
kpiDashboardRouter.put('/entries', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = kpiEntryUpsertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const entry = await prisma.kpiEntry.upsert({
      where: { storeId_date: { storeId: parsed.data.storeId, date: parsed.data.date } },
      create: { ...parsed.data, tenantId, enteredBy: userId },
      update: {
        revenue: parsed.data.revenue,
        transactions: parsed.data.transactions,
        footfall: parsed.data.footfall ?? null,
        unitsSold: parsed.data.unitsSold ?? null,
        staffHours: parsed.data.staffHours ?? null,
      },
      include: { store: { select: { id: true, name: true } } },
    });
    res.json(entry);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /summary — Aggregierte KPIs
kpiDashboardRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.dateFrom || req.query.dateTo) {
      where['date'] = {};
      if (req.query.dateFrom) (where['date'] as Record<string, string>)['gte'] = req.query.dateFrom as string;
      if (req.query.dateTo) (where['date'] as Record<string, string>)['lte'] = req.query.dateTo as string;
    }

    const agg = await prisma.kpiEntry.aggregate({
      where,
      _sum: { revenue: true, transactions: true, footfall: true, unitsSold: true },
      _count: true,
    });

    const storeCount = await prisma.kpiEntry.groupBy({
      by: ['storeId'],
      where,
    });

    const totalRevenue = agg._sum.revenue ?? 0;
    const totalTransactions = agg._sum.transactions ?? 0;
    const totalFootfall = agg._sum.footfall ?? 0;
    const totalUnits = agg._sum.unitsSold ?? 0;

    res.json({
      totalRevenue,
      totalTransactions,
      totalFootfall,
      avgATV: totalTransactions > 0 ? Math.round((totalRevenue / totalTransactions) * 100) / 100 : 0,
      avgConversion: totalFootfall > 0 ? Math.round((totalTransactions / totalFootfall) * 10000) / 100 : 0,
      avgUPT: totalTransactions > 0 ? Math.round((totalUnits / totalTransactions) * 100) / 100 : 0,
      storeCount: storeCount.length,
      entryCount: agg._count,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /trends — Tagesverlauf
kpiDashboardRouter.get('/trends', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (req.query.dateFrom || req.query.dateTo) {
      where['date'] = {};
      if (req.query.dateFrom) (where['date'] as Record<string, string>)['gte'] = req.query.dateFrom as string;
      if (req.query.dateTo) (where['date'] as Record<string, string>)['lte'] = req.query.dateTo as string;
    }

    const entries = await prisma.kpiEntry.findMany({
      where,
      select: { date: true, revenue: true, transactions: true, footfall: true, unitsSold: true, storeId: true },
      orderBy: { date: 'asc' },
      take: 90,
    });
    res.json(entries);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
