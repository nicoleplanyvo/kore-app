import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { budgetPeriodCreateSchema, budgetPeriodUpdateSchema, budgetActualCreateSchema } from '@shared/validators';

export const budgetTrackerRouter: RouterType = Router();
budgetTrackerRouter.use(authenticate, requireToolAccess('performance.budget_tracker'));

// GET /stores
budgetTrackerRouter.get('/stores', async (req, res) => {
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

// GET /periods — Budget-Perioden Liste
budgetTrackerRouter.get('/periods', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (toolStoreIds !== 'all') where['storeId'] = req.query.storeId || { in: toolStoreIds };
    if (req.query.budgetType) where['budgetType'] = req.query.budgetType;

    const [data, total] = await Promise.all([
      prisma.budgetPeriod.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, city: true } },
          _count: { select: { actuals: true } },
        },
        orderBy: { period: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.budgetPeriod.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /periods — Budget-Periode erstellen
budgetTrackerRouter.post('/periods', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = budgetPeriodCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const period = await prisma.budgetPeriod.create({
      data: { ...parsed.data, tenantId, createdBy: userId },
      include: { store: { select: { id: true, name: true } } },
    });
    res.status(201).json(period);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Budget für diese Periode existiert bereits.' });
    console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /periods/:id — Detail mit Actuals
budgetTrackerRouter.get('/periods/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const period = await prisma.budgetPeriod.findFirst({
      where: { id: req.params.id, tenantId },
      include: {
        store: { select: { id: true, name: true, city: true } },
        actuals: { orderBy: { date: 'desc' } },
      },
    });
    if (!period) return res.status(404).json({ error: 'Budget-Periode nicht gefunden.' });
    res.json(period);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /periods/:id — Budget aktualisieren
budgetTrackerRouter.put('/periods/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = budgetPeriodUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.' });

    const result = await prisma.budgetPeriod.updateMany({
      where: { id: req.params.id, tenantId },
      data: parsed.data,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Budget-Periode nicht gefunden.' });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /periods/:id/actuals — Ist-Wert eintragen
budgetTrackerRouter.post('/periods/:id/actuals', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = budgetActualCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    // Verify period belongs to tenant
    const period = await prisma.budgetPeriod.findFirst({ where: { id: req.params.id, tenantId } });
    if (!period) return res.status(404).json({ error: 'Budget-Periode nicht gefunden.' });

    const actual = await prisma.budgetActual.create({
      data: { ...parsed.data, budgetPeriodId: req.params.id, enteredBy: userId },
    });
    res.status(201).json(actual);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /summary — Budget vs Actual Übersicht
budgetTrackerRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.period) where['period'] = req.query.period;

    const periods = await prisma.budgetPeriod.findMany({
      where,
      include: {
        store: { select: { id: true, name: true } },
        actuals: true,
      },
    });

    const result = periods.map((p) => {
      const totalBudget = p.revenue + p.cogs + p.labor + p.rent + p.marketing + p.other;
      const totalActual = p.actuals.reduce((sum, a) => sum + a.actualAmount, 0);
      return {
        id: p.id,
        storeId: p.storeId,
        storeName: p.store?.name,
        period: p.period,
        budgetType: p.budgetType,
        totalBudget,
        totalActual,
        variance: totalActual - totalBudget,
        variancePercent: totalBudget > 0 ? Math.round(((totalActual - totalBudget) / totalBudget) * 10000) / 100 : 0,
      };
    });
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
