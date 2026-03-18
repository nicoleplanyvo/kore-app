import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { z } from 'zod';

export const metrixRouter: RouterType = Router();
metrixRouter.use(authenticate, requireToolAccess('performance.metrix'));

// ── Helpers ──────────────────────────────────────

function calcAchievement(actual: number, target: number, min: number, max?: number | null): number {
  if (target === min) return actual >= target ? 100 : 0;
  const raw = ((actual - min) / (target - min)) * 100;
  if (max != null) {
    const maxPct = ((max - min) / (target - min)) * 100;
    return Math.min(Math.max(raw, 0), maxPct);
  }
  return Math.max(raw, 0);
}

function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── Validation ───────────────────────────────────

const kpiSchema = z.object({
  name: z.string().min(1).max(100),
  unit: z.string().max(20).default('%'),
  weight: z.number().min(0).max(100),
  targetValue: z.number(),
  minValue: z.number().default(0),
  maxValue: z.number().nullable().optional(),
  sortOrder: z.number().int().default(0),
  color: z.string().max(20).default('#9E8460'),
});

const configCreateSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(1).max(200).default('Standard Scorecard'),
  kpis: z.array(kpiSchema).min(1).max(10),
});

const configUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  kpis: z.array(kpiSchema.extend({ id: z.string().optional() })).min(1).max(10).optional(),
});

const entrySchema = z.object({
  configId: z.string().min(1),
  period: z.string().min(1),
  notes: z.string().max(2000).optional(),
  scores: z.array(z.object({
    kpiId: z.string().min(1),
    actualValue: z.number(),
  })).min(1).max(10),
});

// ── GET /stores ──────────────────────────────────

metrixRouter.get('/stores', async (req, res) => {
  try {
    const storeIds = (req as any).toolStoreIds as string[] | 'all';
    const where: any = {};
    if (storeIds !== 'all') where.id = { in: storeIds };
    else where.tenant = { id: req.user!.tenantId };

    const stores = await prisma.store.findMany({
      where: { ...where, isActive: true },
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });
    res.json(stores);
  } catch (e) { res.status(500).json({ error: 'Stores konnten nicht geladen werden' }); }
});

// ── GET /configs ─ List configs for a store ──────

metrixRouter.get('/configs', async (req, res) => {
  try {
    const { storeId } = req.query;
    if (!storeId) return res.status(400).json({ error: 'storeId fehlt' });

    const configs = await prisma.metrixConfig.findMany({
      where: { storeId: storeId as string, isActive: true },
      include: {
        kpis: { orderBy: { sortOrder: 'asc' } },
        creator: { select: { id: true, name: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(configs);
  } catch (e) { res.status(500).json({ error: 'Configs konnten nicht geladen werden' }); }
});

// ── GET /configs/:id ─ Single config with KPIs ──

metrixRouter.get('/configs/:id', async (req, res) => {
  try {
    const config = await prisma.metrixConfig.findUnique({
      where: { id: req.params.id },
      include: {
        kpis: { orderBy: { sortOrder: 'asc' } },
        creator: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
    });
    if (!config) return res.status(404).json({ error: 'Config nicht gefunden' });
    res.json(config);
  } catch (e) { res.status(500).json({ error: 'Config konnte nicht geladen werden' }); }
});

// ── POST /configs ─ Create new config ────────────

metrixRouter.post('/configs', async (req, res) => {
  try {
    const data = configCreateSchema.parse(req.body);

    // Validate weights sum to 100
    const totalWeight = data.kpis.reduce((sum, k) => sum + k.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      return res.status(400).json({ error: `Gewichtung muss 100% ergeben (aktuell: ${totalWeight}%)` });
    }

    const config = await prisma.metrixConfig.create({
      data: {
        storeId: data.storeId,
        name: data.name,
        createdBy: req.user!.sub,
        kpis: {
          create: data.kpis.map((k, i) => ({
            name: k.name,
            unit: k.unit,
            weight: k.weight,
            targetValue: k.targetValue,
            minValue: k.minValue,
            maxValue: k.maxValue ?? null,
            sortOrder: k.sortOrder ?? i,
            color: k.color,
          })),
        },
      },
      include: { kpis: { orderBy: { sortOrder: 'asc' } } },
    });
    res.status(201).json(config);
  } catch (e: any) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validierungsfehler', details: e.errors });
    res.status(500).json({ error: 'Config konnte nicht erstellt werden' });
  }
});

// ── PUT /configs/:id ─ Update config + KPIs ──────

metrixRouter.put('/configs/:id', async (req, res) => {
  try {
    const data = configUpdateSchema.parse(req.body);

    if (data.kpis) {
      const totalWeight = data.kpis.reduce((sum, k) => sum + k.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        return res.status(400).json({ error: `Gewichtung muss 100% ergeben (aktuell: ${totalWeight}%)` });
      }

      // Delete existing KPIs and recreate (simpler than diffing)
      await prisma.metrixKpi.deleteMany({ where: { configId: req.params.id } });
      await prisma.metrixKpi.createMany({
        data: data.kpis.map((k, i) => ({
          configId: req.params.id!,
          name: k.name,
          unit: k.unit,
          weight: k.weight,
          targetValue: k.targetValue,
          minValue: k.minValue,
          maxValue: k.maxValue ?? null,
          sortOrder: k.sortOrder ?? i,
          color: k.color,
        })),
      });
    }

    const config = await prisma.metrixConfig.update({
      where: { id: req.params.id },
      data: { name: data.name },
      include: { kpis: { orderBy: { sortOrder: 'asc' } } },
    });
    res.json(config);
  } catch (e: any) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validierungsfehler', details: e.errors });
    res.status(500).json({ error: 'Config konnte nicht aktualisiert werden' });
  }
});

// ── DELETE /configs/:id ──────────────────────────

metrixRouter.delete('/configs/:id', async (req, res) => {
  try {
    await prisma.metrixConfig.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Config konnte nicht geloescht werden' }); }
});

// ── POST /entries ─ Submit scores for a period ───

metrixRouter.post('/entries', async (req, res) => {
  try {
    const data = entrySchema.parse(req.body);

    // Get KPIs for achievement calculation
    const kpis = await prisma.metrixKpi.findMany({ where: { configId: data.configId } });
    const kpiMap = new Map(kpis.map(k => [k.id, k]));

    // Calculate achievements
    const scoresToCreate = data.scores.map(s => {
      const kpi = kpiMap.get(s.kpiId);
      if (!kpi) throw new Error(`KPI ${s.kpiId} nicht gefunden`);
      const achievement = calcAchievement(s.actualValue, kpi.targetValue, kpi.minValue, kpi.maxValue);
      return { kpiId: s.kpiId, actualValue: s.actualValue, achievement: Math.round(achievement * 10) / 10 };
    });

    // Upsert entry
    const existing = await prisma.metrixEntry.findUnique({
      where: { configId_period: { configId: data.configId, period: data.period } },
    });

    let entry;
    if (existing) {
      // Update: delete old scores, insert new
      await prisma.metrixScore.deleteMany({ where: { entryId: existing.id } });
      entry = await prisma.metrixEntry.update({
        where: { id: existing.id },
        data: {
          notes: data.notes,
          scores: { create: scoresToCreate },
        },
        include: {
          scores: { include: { kpi: true } },
        },
      });
    } else {
      entry = await prisma.metrixEntry.create({
        data: {
          configId: data.configId,
          period: data.period,
          enteredBy: req.user!.sub,
          notes: data.notes,
          scores: { create: scoresToCreate },
        },
        include: {
          scores: { include: { kpi: true } },
        },
      });
    }

    // Calculate overall weighted score
    const overallScore = entry.scores.reduce((sum, s) => {
      const kpi = kpiMap.get(s.kpiId);
      return sum + (s.achievement * (kpi?.weight ?? 0) / 100);
    }, 0);

    res.status(existing ? 200 : 201).json({ ...entry, overallScore: Math.round(overallScore * 10) / 10 });
  } catch (e: any) {
    if (e.name === 'ZodError') return res.status(400).json({ error: 'Validierungsfehler', details: e.errors });
    res.status(500).json({ error: 'Eintrag konnte nicht gespeichert werden' });
  }
});

// ── GET /entries ─ List entries for a config ─────

metrixRouter.get('/entries', async (req, res) => {
  try {
    const { configId, from, to } = req.query;
    if (!configId) return res.status(400).json({ error: 'configId fehlt' });

    const where: any = { configId: configId as string };
    if (from || to) {
      where.period = {};
      if (from) where.period.gte = from as string;
      if (to) where.period.lte = to as string;
    }

    const entries = await prisma.metrixEntry.findMany({
      where,
      include: { scores: { include: { kpi: true } } },
      orderBy: { period: 'desc' },
      take: 24, // max 2 years monthly
    });

    // Enrich with overall scores
    const enriched = entries.map(entry => {
      const overallScore = entry.scores.reduce((sum, s) => {
        return sum + (s.achievement * (s.kpi.weight / 100));
      }, 0);
      return { ...entry, overallScore: Math.round(overallScore * 10) / 10 };
    });

    res.json(enriched);
  } catch (e) { res.status(500).json({ error: 'Eintraege konnten nicht geladen werden' }); }
});

// ── GET /entries/:id ─ Single entry detail ───────

metrixRouter.get('/entries/:id', async (req, res) => {
  try {
    const entry = await prisma.metrixEntry.findUnique({
      where: { id: req.params.id },
      include: {
        scores: { include: { kpi: true }, orderBy: { kpi: { sortOrder: 'asc' } } },
        config: { select: { id: true, name: true, storeId: true } },
      },
    });
    if (!entry) return res.status(404).json({ error: 'Eintrag nicht gefunden' });

    const overallScore = entry.scores.reduce((sum, s) => {
      return sum + (s.achievement * (s.kpi.weight / 100));
    }, 0);

    res.json({ ...entry, overallScore: Math.round(overallScore * 10) / 10 });
  } catch (e) { res.status(500).json({ error: 'Eintrag konnte nicht geladen werden' }); }
});

// ── GET /dashboard ─ Aggregated dashboard ────────

metrixRouter.get('/dashboard', async (req, res) => {
  try {
    const { storeId, configId } = req.query;
    if (!configId) return res.status(400).json({ error: 'configId fehlt' });

    const config = await prisma.metrixConfig.findUnique({
      where: { id: configId as string },
      include: { kpis: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!config) return res.status(404).json({ error: 'Config nicht gefunden' });

    const period = currentPeriod();

    // Current + previous period entries
    const [currentEntry, allEntries] = await Promise.all([
      prisma.metrixEntry.findUnique({
        where: { configId_period: { configId: configId as string, period } },
        include: { scores: { include: { kpi: true } } },
      }),
      prisma.metrixEntry.findMany({
        where: { configId: configId as string },
        include: { scores: { include: { kpi: true } } },
        orderBy: { period: 'desc' },
        take: 12,
      }),
    ]);

    // Current overall
    const currentOverall = currentEntry
      ? currentEntry.scores.reduce((sum, s) => sum + (s.achievement * (s.kpi.weight / 100)), 0)
      : null;

    // Trend: overall scores over time
    const trend = allEntries.reverse().map(entry => {
      const overall = entry.scores.reduce((sum, s) => sum + (s.achievement * (s.kpi.weight / 100)), 0);
      return { period: entry.period, overallScore: Math.round(overall * 10) / 10 };
    });

    // Per-KPI breakdown for current period
    const kpiBreakdown = config.kpis.map(kpi => {
      const score = currentEntry?.scores.find(s => s.kpiId === kpi.id);
      return {
        id: kpi.id,
        name: kpi.name,
        unit: kpi.unit,
        weight: kpi.weight,
        targetValue: kpi.targetValue,
        actualValue: score?.actualValue ?? null,
        achievement: score?.achievement ?? null,
        color: kpi.color,
      };
    });

    // Ampel status
    const ampel = currentOverall == null ? 'grey'
      : currentOverall >= 90 ? 'green'
      : currentOverall >= 70 ? 'yellow'
      : 'red';

    // Best / worst KPI
    const scoredKpis = kpiBreakdown.filter(k => k.achievement != null);
    const bestKpi = scoredKpis.length ? scoredKpis.reduce((a, b) => (a.achievement ?? 0) > (b.achievement ?? 0) ? a : b) : null;
    const worstKpi = scoredKpis.length ? scoredKpis.reduce((a, b) => (a.achievement ?? 0) < (b.achievement ?? 0) ? a : b) : null;

    // Previous period comparison
    const prevEntry = allEntries.length >= 2 ? allEntries[allEntries.length - 2] : null;
    const prevOverall = prevEntry
      ? prevEntry.scores.reduce((sum, s) => sum + (s.achievement * (s.kpi.weight / 100)), 0)
      : null;
    const change = currentOverall != null && prevOverall != null
      ? Math.round((currentOverall - prevOverall) * 10) / 10
      : null;

    res.json({
      period,
      configName: config.name,
      currentOverall: currentOverall != null ? Math.round(currentOverall * 10) / 10 : null,
      previousOverall: prevOverall != null ? Math.round(prevOverall * 10) / 10 : null,
      change,
      ampel,
      kpiBreakdown,
      bestKpi,
      worstKpi,
      trend,
      entryCount: allEntries.length,
    });
  } catch (e) { res.status(500).json({ error: 'Dashboard konnte nicht geladen werden' }); }
});

// ── GET /compare ─ Multi-store comparison ────────

metrixRouter.get('/compare', async (req, res) => {
  try {
    const { period } = req.query;
    const targetPeriod = (period as string) || currentPeriod();
    const storeIds = (req as any).toolStoreIds as string[] | 'all';

    const storeWhere: any = { isActive: true };
    if (storeIds !== 'all') storeWhere.id = { in: storeIds };
    else storeWhere.tenant = { id: req.user!.tenantId };

    const stores = await prisma.store.findMany({
      where: storeWhere,
      select: { id: true, name: true },
    });

    const results = [];
    for (const store of stores) {
      const configs = await prisma.metrixConfig.findMany({
        where: { storeId: store.id, isActive: true },
        select: { id: true, name: true },
      });

      for (const config of configs) {
        const entry = await prisma.metrixEntry.findUnique({
          where: { configId_period: { configId: config.id, period: targetPeriod } },
          include: { scores: { include: { kpi: true } } },
        });

        const overall = entry
          ? entry.scores.reduce((sum, s) => sum + (s.achievement * (s.kpi.weight / 100)), 0)
          : null;

        results.push({
          storeId: store.id,
          storeName: store.name,
          configId: config.id,
          configName: config.name,
          overallScore: overall != null ? Math.round(overall * 10) / 10 : null,
          hasData: !!entry,
        });
      }
    }

    // Sort by overall score descending
    results.sort((a, b) => (b.overallScore ?? -1) - (a.overallScore ?? -1));

    res.json({ period: targetPeriod, stores: results });
  } catch (e) { res.status(500).json({ error: 'Vergleich konnte nicht geladen werden' }); }
});
