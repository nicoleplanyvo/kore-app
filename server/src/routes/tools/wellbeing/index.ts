import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  wellbeingCheckInCreateSchema,
  wellbeingResourceCreateSchema,
  wellbeingResourceUpdateSchema,
} from '@shared/validators';

export const wellbeingRouter: RouterType = Router();
wellbeingRouter.use(authenticate, requireToolAccess('coaching.wellbeing'));

// ── STORES ──────────────────────────────────────────

// GET /stores
wellbeingRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where = toolStoreIds === 'all' ? {} : { id: { in: toolStoreIds } };
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

// ── CHECK-INS ───────────────────────────────────────

// GET /checkins?storeId=&from=&to=&page=&pageSize=
wellbeingRouter.get('/checkins', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from) where['date'] = { ...(where['date'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['date'] = { ...(where['date'] as any || {}), lte: new Date(req.query.to as string + 'T23:59:59') };

    const [data, total] = await Promise.all([
      prisma.wellbeingCheckIn.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.wellbeingCheckIn.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /checkins
wellbeingRouter.post('/checkins', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = wellbeingCheckInCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const userId = parsed.data.isAnonymous ? null : req.user!.sub;

    const checkin = await prisma.wellbeingCheckIn.create({
      data: { ...parsed.data, tenantId, userId },
    });

    // Critical value alert: moodScore < 2 triggers a logged alert (anonymous)
    if (parsed.data.moodScore < 2) {
      console.warn(
        `[WELLBEING ALERT] Kritischer Stimmungswert (${parsed.data.moodScore}) in Tenant ${tenantId}` +
        (parsed.data.storeId ? `, Store ${parsed.data.storeId}` : '') +
        ' — kein Name gespeichert (Datenschutz).'
      );
    }

    res.status(201).json(checkin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── RESOURCES ───────────────────────────────────────

// GET /resources
wellbeingRouter.get('/resources', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const resources = await prisma.wellbeingResource.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /resources
wellbeingRouter.post('/resources', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = wellbeingResourceCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const resource = await prisma.wellbeingResource.create({
      data: { ...parsed.data, tenantId },
    });
    res.status(201).json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /resources/:id
wellbeingRouter.put('/resources/:id', async (req, res) => {
  try {
    const parsed = wellbeingResourceUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const resource = await prisma.wellbeingResource.update({
      where: { id: req.params['id'] },
      data: parsed.data,
    });
    res.json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// DELETE /resources/:id — Soft-delete
wellbeingRouter.delete('/resources/:id', async (req, res) => {
  try {
    const resource = await prisma.wellbeingResource.update({
      where: { id: req.params['id'] },
      data: { isActive: false },
    });
    res.json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── SUMMARY ─────────────────────────────────────────

// GET /summary?storeId=&from=&to=
wellbeingRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from) where['date'] = { ...(where['date'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['date'] = { ...(where['date'] as any || {}), lte: new Date(req.query.to as string + 'T23:59:59') };

    const agg = await prisma.wellbeingCheckIn.aggregate({
      where,
      _avg: { moodScore: true, energyLevel: true, stressLevel: true, workloadRating: true },
      _count: true,
      _min: { date: true },
      _max: { date: true },
    });

    // Count distinct non-null userIds for participation
    const uniqueUsersResult = await prisma.wellbeingCheckIn.findMany({
      where: { ...where, userId: { not: null } },
      select: { userId: true },
      distinct: ['userId'],
    });

    // Count critical alerts (moodScore < 2) in this period
    const criticalCount = await prisma.wellbeingCheckIn.count({
      where: { ...where, moodScore: { lt: 2 } },
    });

    res.json({
      totalCheckIns: agg._count,
      avgMood: agg._avg.moodScore ? Math.round(agg._avg.moodScore * 10) / 10 : null,
      avgEnergy: agg._avg.energyLevel ? Math.round(agg._avg.energyLevel * 10) / 10 : null,
      avgStress: agg._avg.stressLevel ? Math.round(agg._avg.stressLevel * 10) / 10 : null,
      avgWorkload: agg._avg.workloadRating ? Math.round(agg._avg.workloadRating * 10) / 10 : null,
      periodStart: agg._min.date,
      periodEnd: agg._max.date,
      uniqueUsers: uniqueUsersResult.length,
      criticalAlerts: criticalCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── TRENDS ──────────────────────────────────────────

// GET /trends?storeId=&weeks=8
wellbeingRouter.get('/trends', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const weeks = Math.min(52, Math.max(1, Number(req.query.weeks) || 8));

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    // Calculate start date (N weeks ago from Monday)
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - weeks * 7);
    where['date'] = { gte: startDate };

    const checkIns = await prisma.wellbeingCheckIn.findMany({
      where,
      select: { date: true, moodScore: true, energyLevel: true, stressLevel: true, workloadRating: true },
      orderBy: { date: 'asc' },
    });

    // Group by ISO week
    const weekMap = new Map<string, {
      mood: number[]; energy: number[]; stress: number[]; workload: number[];
    }>();

    for (const ci of checkIns) {
      const d = new Date(ci.date);
      const oneJan = new Date(d.getFullYear(), 0, 1);
      const dayOfYear = Math.ceil((d.getTime() - oneJan.getTime()) / 86400000);
      const weekNum = Math.ceil((dayOfYear + oneJan.getDay()) / 7);
      const key = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

      if (!weekMap.has(key)) {
        weekMap.set(key, { mood: [], energy: [], stress: [], workload: [] });
      }
      const bucket = weekMap.get(key)!;
      bucket.mood.push(ci.moodScore);
      bucket.energy.push(ci.energyLevel);
      bucket.stress.push(ci.stressLevel);
      bucket.workload.push(ci.workloadRating);
    }

    const avg = (arr: number[]) => arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

    const trends = Array.from(weekMap.entries())
      .map(([weekLabel, d]) => ({
        weekLabel,
        avgMood: avg(d.mood),
        avgEnergy: avg(d.energy),
        avgStress: avg(d.stress),
        avgWorkload: avg(d.workload),
        checkInCount: d.mood.length,
      }))
      .sort((a, b) => a.weekLabel.localeCompare(b.weekLabel));

    res.json(trends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DASHBOARD ───────────────────────────────────────

// GET /dashboard?storeId=&from=&to=
wellbeingRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from) where['date'] = { ...(where['date'] as any || {}), gte: new Date(req.query.from as string) };
    if (req.query.to) where['date'] = { ...(where['date'] as any || {}), lte: new Date(req.query.to as string + 'T23:59:59') };

    const checkIns = await prisma.wellbeingCheckIn.findMany({
      where,
      include: { store: { select: { id: true, name: true } } },
      orderBy: { date: 'asc' },
    });

    const total = checkIns.length;

    // Overall averages
    const sumMood = checkIns.reduce((s, c) => s + c.moodScore, 0);
    const sumEnergy = checkIns.reduce((s, c) => s + c.energyLevel, 0);
    const sumStress = checkIns.reduce((s, c) => s + c.stressLevel, 0);
    const sumWorkload = checkIns.reduce((s, c) => s + c.workloadRating, 0);

    const avgMood = total > 0 ? Math.round((sumMood / total) * 10) / 10 : null;
    const avgEnergy = total > 0 ? Math.round((sumEnergy / total) * 10) / 10 : null;
    const avgStress = total > 0 ? Math.round((sumStress / total) * 10) / 10 : null;
    const avgWorkload = total > 0 ? Math.round((sumWorkload / total) * 10) / 10 : null;

    // Participation: unique non-null users
    const uniqueUserIds = new Set(checkIns.filter(c => c.userId).map(c => c.userId));
    const participationCount = uniqueUserIds.size;

    // Critical alerts
    const criticalAlerts = checkIns.filter(c => c.moodScore < 2).length;

    // Store comparison
    const storeMap = new Map<string, { id: string; name: string; moods: number[]; energies: number[]; stresses: number[] }>();
    for (const c of checkIns) {
      if (!c.storeId || !c.store) continue;
      if (!storeMap.has(c.storeId)) {
        storeMap.set(c.storeId, { id: c.storeId, name: c.store.name, moods: [], energies: [], stresses: [] });
      }
      const bucket = storeMap.get(c.storeId)!;
      bucket.moods.push(c.moodScore);
      bucket.energies.push(c.energyLevel);
      bucket.stresses.push(c.stressLevel);
    }

    const storeComparison = Array.from(storeMap.values())
      .map(s => ({
        storeId: s.id,
        storeName: s.name,
        checkIns: s.moods.length,
        avgMood: Math.round((s.moods.reduce((a, b) => a + b, 0) / s.moods.length) * 10) / 10,
        avgEnergy: Math.round((s.energies.reduce((a, b) => a + b, 0) / s.energies.length) * 10) / 10,
        avgStress: Math.round((s.stresses.reduce((a, b) => a + b, 0) / s.stresses.length) * 10) / 10,
      }))
      .sort((a, b) => b.avgMood - a.avgMood);

    // Trend by date
    const dateMap = new Map<string, { moods: number[]; count: number }>();
    for (const c of checkIns) {
      const dateStr = new Date(c.date).toISOString().split('T')[0] as string;
      if (!dateMap.has(dateStr)) dateMap.set(dateStr, { moods: [], count: 0 });
      const bucket = dateMap.get(dateStr)!;
      bucket.moods.push(c.moodScore);
      bucket.count++;
    }

    const trends = Array.from(dateMap.entries())
      .map(([date, d]) => ({
        date,
        avgMood: Math.round((d.moods.reduce((a, b) => a + b, 0) / d.moods.length) * 10) / 10,
        checkIns: d.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      kpis: {
        total,
        avgMood,
        avgEnergy,
        avgStress,
        avgWorkload,
        participationCount,
        criticalAlerts,
      },
      storeComparison,
      trends,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
