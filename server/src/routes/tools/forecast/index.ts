import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { forecastCreateSchema, forecastUpdateSchema } from '@shared/validators';

export const forecastRouter: RouterType = Router();
forecastRouter.use(authenticate, requireToolAccess('performance.forecast'));

// GET /stores
forecastRouter.get('/stores', async (req, res) => {
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

// GET / — Forecasts Liste
forecastRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    if (toolStoreIds !== 'all') where['storeId'] = req.query.storeId || { in: toolStoreIds };
    if (req.query.forecastType) where['forecastType'] = req.query.forecastType;

    const [data, total] = await Promise.all([
      prisma.forecast.findMany({
        where,
        include: { store: { select: { id: true, name: true, city: true } } },
        orderBy: { period: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.forecast.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST / — Neuen Forecast erstellen
forecastRouter.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = forecastCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });

    const forecast = await prisma.forecast.create({
      data: { ...parsed.data, tenantId, createdBy: userId },
      include: { store: { select: { id: true, name: true } } },
    });
    res.status(201).json(forecast);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Forecast für diese Periode existiert bereits.' });
    console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /:id — Forecast Detail
forecastRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const forecast = await prisma.forecast.findFirst({
      where: { id: req.params.id, tenantId },
      include: { store: { select: { id: true, name: true, city: true } } },
    });
    if (!forecast) return res.status(404).json({ error: 'Forecast nicht gefunden.' });
    res.json(forecast);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /:id — Forecast aktualisieren (Ist-Wert eintragen)
forecastRouter.put('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = forecastUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.' });

    const result = await prisma.forecast.updateMany({
      where: { id: req.params.id, tenantId },
      data: parsed.data,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Forecast nicht gefunden.' });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /reports/accuracy — Forecast vs Actual Genauigkeit
forecastRouter.get('/reports/accuracy', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId, actualValue: { not: null } };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const forecasts = await prisma.forecast.findMany({
      where,
      include: { store: { select: { id: true, name: true } } },
      orderBy: { period: 'desc' },
      take: 50,
    });

    const result = forecasts.map((f) => {
      const actual = f.actualValue ?? 0;
      const deviation = f.forecastValue > 0 ? Math.round(((actual - f.forecastValue) / f.forecastValue) * 10000) / 100 : 0;
      const accuracy = Math.max(0, 100 - Math.abs(deviation));
      return {
        id: f.id,
        storeId: f.storeId,
        storeName: f.store?.name,
        period: f.period,
        forecastType: f.forecastType,
        forecastValue: f.forecastValue,
        actualValue: actual,
        deviation,
        accuracy: Math.round(accuracy * 100) / 100,
      };
    });

    const avgAccuracy = result.length > 0 ? Math.round(result.reduce((s, r) => s + r.accuracy, 0) / result.length * 100) / 100 : 0;
    res.json({ forecasts: result, averageAccuracy: avgAccuracy });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
