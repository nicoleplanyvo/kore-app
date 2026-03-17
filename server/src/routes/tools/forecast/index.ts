import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { forecastCreateSchema, forecastUpdateSchema } from '@shared/validators';

export const forecastRouter: RouterType = Router();
forecastRouter.use(authenticate, requireToolAccess('performance.forecast'));

/* ──────────────────────────────────────────────
   Helper: accuracy calculation
   ────────────────────────────────────────────── */
function calcAccuracy(forecastValue: number, actualValue: number): number {
  if (forecastValue === 0) return actualValue === 0 ? 100 : 0;
  const deviation = Math.abs((actualValue - forecastValue) / forecastValue * 100);
  return Math.max(0, Math.min(100, 100 - deviation));
}

function calcDeviation(forecastValue: number, actualValue: number): number {
  if (forecastValue === 0) return 0;
  return Math.round(((actualValue - forecastValue) / forecastValue) * 10000) / 100;
}

/* ──────────────────────────────────────────────
   GET /stores — Stores des Users
   ────────────────────────────────────────────── */
forecastRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };
    else if (tenantId) where['tenantId'] = tenantId;
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

/* ──────────────────────────────────────────────
   GET /users — Users eines Stores (fuer Zuordnung)
   ────────────────────────────────────────────── */
forecastRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const storeId = req.query.storeId as string | undefined;

    if (!storeId) {
      // Alle Users des Tenants
      const users = await prisma.user.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      });
      return res.json(users);
    }

    // Users die dem Store zugeordnet sind
    const assignments = await prisma.userStoreAssignment.findMany({
      where: { storeId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    const users = assignments.map((a) => a.user);
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

/* ──────────────────────────────────────────────
   GET /dashboard — Dashboard KPIs + Trends
   ────────────────────────────────────────────── */
forecastRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = req.query.storeId as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const where: Record<string, unknown> = { tenantId };
    if (storeId) {
      where['storeId'] = storeId;
    } else if (toolStoreIds !== 'all') {
      where['storeId'] = { in: toolStoreIds };
    }
    if (from || to) {
      const periodFilter: Record<string, string> = {};
      if (from) periodFilter['gte'] = from;
      if (to) periodFilter['lte'] = to;
      where['period'] = periodFilter;
    }

    // Alle Forecasts fuer den Zeitraum
    const forecasts = await prisma.forecast.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, city: true } },
      },
      orderBy: { period: 'asc' },
    });

    const totalForecasts = forecasts.length;
    const withActuals = forecasts.filter((f) => f.actualValue !== null);

    // Durchschnittliche Genauigkeit
    let avgAccuracy = 0;
    if (withActuals.length > 0) {
      const totalAcc = withActuals.reduce(
        (sum, f) => sum + calcAccuracy(f.forecastValue, f.actualValue!),
        0,
      );
      avgAccuracy = Math.round((totalAcc / withActuals.length) * 100) / 100;
    }

    // Bester / Schlechtester Store
    const storeAccMap = new Map<string, { name: string; accuracies: number[] }>();
    for (const f of withActuals) {
      const sid = f.storeId;
      if (!storeAccMap.has(sid)) {
        storeAccMap.set(sid, { name: f.store?.name ?? sid, accuracies: [] });
      }
      storeAccMap.get(sid)!.accuracies.push(calcAccuracy(f.forecastValue, f.actualValue!));
    }

    let bestStore = { name: '-', accuracy: 0 };
    let worstStore = { name: '-', accuracy: 100 };
    for (const [, v] of storeAccMap) {
      const avg = v.accuracies.reduce((a, b) => a + b, 0) / v.accuracies.length;
      if (avg > bestStore.accuracy) bestStore = { name: v.name, accuracy: Math.round(avg * 100) / 100 };
      if (avg < worstStore.accuracy) worstStore = { name: v.name, accuracy: Math.round(avg * 100) / 100 };
    }
    if (storeAccMap.size === 0) worstStore = { name: '-', accuracy: 0 };

    // Trends: group by period (last 14 unique periods)
    const periodMap = new Map<string, { forecast: number; actual: number; count: number }>();
    for (const f of forecasts) {
      const key = f.period;
      if (!periodMap.has(key)) periodMap.set(key, { forecast: 0, actual: 0, count: 0 });
      const entry = periodMap.get(key)!;
      entry.forecast += f.forecastValue;
      if (f.actualValue !== null) entry.actual += f.actualValue;
      entry.count++;
    }
    const trendData = Array.from(periodMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([period, v]) => ({
        period,
        forecast: Math.round(v.forecast),
        actual: Math.round(v.actual),
        count: v.count,
      }));

    // Accuracy by user
    const userAccMap = new Map<string, { userId: string; accuracies: number[] }>();
    for (const f of withActuals) {
      const uid = f.createdBy;
      if (!userAccMap.has(uid)) userAccMap.set(uid, { userId: uid, accuracies: [] });
      userAccMap.get(uid)!.accuracies.push(calcAccuracy(f.forecastValue, f.actualValue!));
    }

    // Resolve user names
    const userIds = Array.from(userAccMap.keys());
    const users = userIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : [];
    const userNameMap = new Map(users.map((u) => [u.id, u.name]));

    const accuracyByUser = Array.from(userAccMap.entries()).map(([uid, v]) => ({
      userId: uid,
      userName: userNameMap.get(uid) ?? uid,
      avgAccuracy: Math.round((v.accuracies.reduce((a, b) => a + b, 0) / v.accuracies.length) * 100) / 100,
      count: v.accuracies.length,
    })).sort((a, b) => b.avgAccuracy - a.avgAccuracy);

    res.json({
      totalForecasts,
      withActuals: withActuals.length,
      avgAccuracy,
      bestStore,
      worstStore,
      trendData,
      accuracyByUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

/* ──────────────────────────────────────────────
   GET /reports/accuracy — Detaillierter Genauigkeitsbericht
   ────────────────────────────────────────────── */
forecastRouter.get('/reports/accuracy', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = req.query.storeId as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const where: Record<string, unknown> = { tenantId, actualValue: { not: null } };
    if (storeId) {
      where['storeId'] = storeId;
    } else if (toolStoreIds !== 'all') {
      where['storeId'] = { in: toolStoreIds };
    }
    if (from || to) {
      const periodFilter: Record<string, string> = {};
      if (from) periodFilter['gte'] = from;
      if (to) periodFilter['lte'] = to;
      where['period'] = periodFilter;
    }

    const forecasts = await prisma.forecast.findMany({
      where,
      include: { store: { select: { id: true, name: true } } },
      orderBy: { period: 'desc' },
      take: 200,
    });

    const result = forecasts.map((f) => {
      const actual = f.actualValue ?? 0;
      const deviation = calcDeviation(f.forecastValue, actual);
      const accuracy = Math.round(calcAccuracy(f.forecastValue, actual) * 100) / 100;
      return {
        id: f.id,
        storeId: f.storeId,
        storeName: f.store?.name,
        period: f.period,
        forecastType: f.forecastType,
        forecastValue: f.forecastValue,
        actualValue: actual,
        deviation,
        accuracy,
        createdBy: f.createdBy,
      };
    });

    // Aggregate by store
    const storeMap = new Map<string, { name: string; totalAcc: number; count: number }>();
    for (const r of result) {
      if (!storeMap.has(r.storeId)) storeMap.set(r.storeId, { name: r.storeName ?? r.storeId, totalAcc: 0, count: 0 });
      const s = storeMap.get(r.storeId)!;
      s.totalAcc += r.accuracy;
      s.count++;
    }
    const byStore = Array.from(storeMap.entries()).map(([id, v]) => ({
      storeId: id,
      storeName: v.name,
      avgAccuracy: Math.round((v.totalAcc / v.count) * 100) / 100,
      count: v.count,
    }));

    const avgAccuracy = result.length > 0
      ? Math.round((result.reduce((s, r) => s + r.accuracy, 0) / result.length) * 100) / 100
      : 0;

    res.json({ forecasts: result, byStore, averageAccuracy: avgAccuracy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

/* ──────────────────────────────────────────────
   GET / — Forecasts Liste mit Filtern
   ────────────────────────────────────────────── */
forecastRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.forecastType) where['forecastType'] = req.query.forecastType;
    if (req.query.from || req.query.to) {
      const periodFilter: Record<string, string> = {};
      if (req.query.from) periodFilter['gte'] = req.query.from as string;
      if (req.query.to) periodFilter['lte'] = req.query.to as string;
      where['period'] = periodFilter;
    }

    const [data, total] = await Promise.all([
      prisma.forecast.findMany({
        where,
        include: {
          store: { select: { id: true, name: true, city: true } },
        },
        orderBy: { period: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.forecast.count({ where }),
    ]);

    // Enrich with deviation / accuracy
    const enriched = data.map((f) => {
      const deviation = f.actualValue !== null ? calcDeviation(f.forecastValue, f.actualValue) : null;
      const accuracy = f.actualValue !== null ? Math.round(calcAccuracy(f.forecastValue, f.actualValue) * 100) / 100 : null;
      return { ...f, deviation, accuracy };
    });

    res.json({ data: enriched, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

/* ──────────────────────────────────────────────
   POST / — Neuen Forecast erstellen
   ────────────────────────────────────────────── */
forecastRouter.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = forecastCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    }

    const forecast = await prisma.forecast.create({
      data: { ...parsed.data, tenantId, createdBy: userId },
      include: { store: { select: { id: true, name: true, city: true } } },
    });
    res.status(201).json(forecast);
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Forecast fuer diese Periode existiert bereits.' });
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

/* ──────────────────────────────────────────────
   GET /:id — Forecast Detail
   ────────────────────────────────────────────── */
forecastRouter.get('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const forecast = await prisma.forecast.findFirst({
      where: { id: req.params.id, tenantId },
      include: { store: { select: { id: true, name: true, city: true } } },
    });
    if (!forecast) return res.status(404).json({ error: 'Forecast nicht gefunden.' });

    const deviation = forecast.actualValue !== null ? calcDeviation(forecast.forecastValue, forecast.actualValue) : null;
    const accuracy = forecast.actualValue !== null ? Math.round(calcAccuracy(forecast.forecastValue, forecast.actualValue) * 100) / 100 : null;

    res.json({ ...forecast, deviation, accuracy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

/* ──────────────────────────────────────────────
   PUT /:id — Forecast aktualisieren
   ────────────────────────────────────────────── */
forecastRouter.put('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = forecastUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    }

    const existing = await prisma.forecast.findFirst({
      where: { id: req.params.id, tenantId },
    });
    if (!existing) return res.status(404).json({ error: 'Forecast nicht gefunden.' });

    const updated = await prisma.forecast.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { store: { select: { id: true, name: true, city: true } } },
    });

    const deviation = updated.actualValue !== null ? calcDeviation(updated.forecastValue, updated.actualValue) : null;
    const accuracy = updated.actualValue !== null ? Math.round(calcAccuracy(updated.forecastValue, updated.actualValue) * 100) / 100 : null;

    res.json({ ...updated, deviation, accuracy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

/* ──────────────────────────────────────────────
   DELETE /:id — Forecast loeschen
   ────────────────────────────────────────────── */
forecastRouter.delete('/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;

    const existing = await prisma.forecast.findFirst({
      where: { id: req.params.id, tenantId },
    });
    if (!existing) return res.status(404).json({ error: 'Forecast nicht gefunden.' });

    await prisma.forecast.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
