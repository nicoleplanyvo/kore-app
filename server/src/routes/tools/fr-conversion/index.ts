import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { conversionGoalSchema } from '@shared/validators';

export const frConversionRouter: RouterType = Router();
frConversionRouter.use(authenticate, requireToolAccess('customer.fr_conversion'));

// GET /goals — List conversion goals for toolStoreIds
frConversionRouter.get('/goals', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const goals = await prisma.conversionGoal.findMany({
      where,
      include: { store: { select: { id: true, name: true, city: true } } },
      orderBy: { period: 'desc' },
    });
    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /goals — Upsert goal (storeId + period unique)
frConversionRouter.put('/goals', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const parsed = conversionGoalSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const storeId = (req.body.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId ist erforderlich.' });

    const goal = await prisma.conversionGoal.upsert({
      where: { storeId_period: { storeId, period: parsed.data.period } },
      create: { storeId, ...parsed.data },
      update: { targetConversion: parsed.data.targetConversion, targetAvgBasket: parsed.data.targetAvgBasket },
    });
    res.json(goal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /analysis — Conversion analysis from FootfallEntry data
frConversionRouter.get('/analysis', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from) where['date'] = { ...(where['date'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['date'] = { ...(where['date'] as any || {}), lte: new Date(req.query.to as string) };

    const entries = await prisma.footfallEntry.findMany({
      where,
      include: { store: { select: { id: true, name: true, city: true } } },
      orderBy: { date: 'desc' },
    });

    const totalFootfall = entries.reduce((s, e) => s + e.footfall, 0);
    const totalTransactions = entries.reduce((s, e) => s + (e.transactions ?? 0), 0);
    const totalRevenue = entries.reduce((s, e) => s + (e.revenue ?? 0), 0);
    const avgConversion = totalFootfall > 0 ? Math.round((totalTransactions / totalFootfall) * 10000) / 100 : 0;
    const avgBasket = totalTransactions > 0 ? Math.round((totalRevenue / totalTransactions) * 100) / 100 : 0;

    res.json({
      totalFootfall,
      totalTransactions,
      totalRevenue,
      avgConversion,
      avgBasket,
      entryCount: entries.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /comparison — Compare stores
frConversionRouter.get('/comparison', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from) where['date'] = { ...(where['date'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['date'] = { ...(where['date'] as any || {}), lte: new Date(req.query.to as string) };

    const entries = await prisma.footfallEntry.findMany({
      where,
      include: { store: { select: { id: true, name: true, city: true } } },
    });

    const byStore = new Map<string, { store: { id: string; name: string; city: string | null }; footfall: number; transactions: number; revenue: number }>();
    for (const e of entries) {
      const existing = byStore.get(e.storeId) || { store: e.store, footfall: 0, transactions: 0, revenue: 0 };
      existing.footfall += e.footfall;
      existing.transactions += e.transactions ?? 0;
      existing.revenue += e.revenue ?? 0;
      byStore.set(e.storeId, existing);
    }

    const comparison = Array.from(byStore.values()).map((s) => ({
      ...s,
      conversionRate: s.footfall > 0 ? Math.round((s.transactions / s.footfall) * 10000) / 100 : 0,
      avgBasket: s.transactions > 0 ? Math.round((s.revenue / s.transactions) * 100) / 100 : 0,
    }));

    res.json(comparison);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /trends — Trends over time
frConversionRouter.get('/trends', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from) where['date'] = { ...(where['date'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['date'] = { ...(where['date'] as any || {}), lte: new Date(req.query.to as string) };

    const entries = await prisma.footfallEntry.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    const byDate = new Map<string, { date: string; footfall: number; transactions: number; revenue: number }>();
    for (const e of entries) {
      const dateStr = e.date.slice(0, 10);
      const existing = byDate.get(dateStr) || { date: dateStr, footfall: 0, transactions: 0, revenue: 0 };
      existing.footfall += e.footfall;
      existing.transactions += e.transactions ?? 0;
      existing.revenue += e.revenue ?? 0;
      byDate.set(dateStr, existing);
    }

    const trends = Array.from(byDate.values()).map((d) => ({
      ...d,
      conversionRate: d.footfall > 0 ? Math.round((d.transactions / d.footfall) * 10000) / 100 : 0,
      avgBasket: d.transactions > 0 ? Math.round((d.revenue / d.transactions) * 100) / 100 : 0,
    }));

    res.json(trends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
