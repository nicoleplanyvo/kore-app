import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { z } from 'zod';

export const budgetTrackerRouter: RouterType = Router();
budgetTrackerRouter.use(authenticate, requireToolAccess('performance.budget_tracker'));

// ── Helpers ──────────────────────────────────────

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Parse "2025-03" into { year, month } */
function parsePeriod(period: string): { year: number; month: number } {
  const parts = period.split('-').map(Number);
  return { year: parts[0] ?? 0, month: parts[1] ?? 0 };
}

/** Build start/end dates for a month period like "2025-03" */
function monthRange(period: string): { from: string; to: string } {
  const { year, month } = parsePeriod(period);
  const from = `${period}-01`;
  const to = `${period}-${String(daysInMonth(year, month)).padStart(2, '0')}`;
  return { from, to };
}

/** Current month string "YYYY-MM" */
function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Get ISO week number for a date string */
function isoWeek(dateStr: string): number {
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

// ── Validation Schemas ───────────────────────────

const targetCreateSchema = z.object({
  storeId: z.string().min(1),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  targetRevenue: z.number().min(0),
  minTarget: z.number().min(0).optional(),
  notes: z.string().max(2000).optional(),
});

const targetImportSchema = z.object({
  storeId: z.string().min(1),
  entries: z.array(z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/),
    targetRevenue: z.number().min(0),
    minTarget: z.number().min(0).optional(),
  })).min(1).max(24),
});

const actualCreateSchema = z.object({
  storeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  amount: z.number().min(0),
  description: z.string().max(500).optional(),
});

const actualUpdateSchema = z.object({
  amount: z.number().min(0),
  description: z.string().max(500).optional(),
});

// ── Shared store query builder ───────────────────

function buildStoreWhere(tenantId: string, toolStoreIds: string[] | 'all') {
  const where: Record<string, unknown> = { isActive: true };
  if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };
  else if (tenantId) where['tenantId'] = tenantId;
  return where;
}

// ── GET /stores ──────────────────────────────────

budgetTrackerRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;
    const stores = await prisma.store.findMany({
      where: buildStoreWhere(tenantId, toolStoreIds),
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });
    res.json(stores);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /targets ─────────────────────────────────
// Query: storeId, period (month), from, to

budgetTrackerRouter.get('/targets', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const where: Record<string, unknown> = { tenantId, budgetType: 'MONTHLY' };
    if (req.query.storeId) where['storeId'] = String(req.query.storeId);
    if (toolStoreIds !== 'all' && !req.query.storeId) where['storeId'] = { in: toolStoreIds };

    if (req.query.period) {
      where['period'] = String(req.query.period);
    } else if (req.query.from || req.query.to) {
      const periodFilter: Record<string, string> = {};
      if (req.query.from) periodFilter['gte'] = String(req.query.from);
      if (req.query.to) periodFilter['lte'] = String(req.query.to);
      where['period'] = periodFilter;
    }

    const targets = await prisma.budgetPeriod.findMany({
      where,
      include: { store: { select: { id: true, name: true, city: true } } },
      orderBy: { period: 'desc' },
    });

    // Map to cleaner shape
    const data = targets.map((t) => ({
      id: t.id,
      storeId: t.storeId,
      storeName: t.store?.name,
      storeCity: t.store?.city,
      period: t.period,
      targetRevenue: t.revenue,
      minTarget: t.cogs, // repurposed: cogs = minTarget
      notes: t.notes,
      createdAt: t.createdAt,
    }));
    res.json(data);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /targets ────────────────────────────────

budgetTrackerRouter.post('/targets', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = targetCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const { storeId, period, targetRevenue, minTarget, notes } = parsed.data;

    // Upsert: update if exists, create otherwise
    const existing = await prisma.budgetPeriod.findFirst({
      where: { storeId, period, budgetType: 'MONTHLY', tenantId },
    });

    let target;
    if (existing) {
      await prisma.budgetPeriod.update({
        where: { id: existing.id },
        data: { revenue: targetRevenue, cogs: minTarget ?? 0, notes },
      });
      target = { ...existing, revenue: targetRevenue, cogs: minTarget ?? 0, notes };
    } else {
      target = await prisma.budgetPeriod.create({
        data: {
          storeId,
          period,
          budgetType: 'MONTHLY',
          revenue: targetRevenue,
          cogs: minTarget ?? 0, // repurpose cogs as minTarget
          labor: 0, rent: 0, marketing: 0, other: 0,
          notes,
          tenantId,
          createdBy: userId,
        },
        include: { store: { select: { id: true, name: true } } },
      });
    }
    res.status(201).json({
      id: target.id,
      storeId: target.storeId,
      period: target.period,
      targetRevenue: target.revenue,
      minTarget: target.cogs,
    });
  } catch (err: any) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Ziel fuer diese Periode existiert bereits.' });
    console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /targets/import ─────────────────────────

budgetTrackerRouter.post('/targets/import', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = targetImportSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const { storeId, entries } = parsed.data;
    let created = 0;
    let updated = 0;

    for (const entry of entries) {
      const existing = await prisma.budgetPeriod.findFirst({
        where: { storeId, period: entry.period, budgetType: 'MONTHLY', tenantId },
      });
      if (existing) {
        await prisma.budgetPeriod.update({
          where: { id: existing.id },
          data: { revenue: entry.targetRevenue, cogs: entry.minTarget ?? 0 },
        });
        updated++;
      } else {
        await prisma.budgetPeriod.create({
          data: {
            storeId, period: entry.period, budgetType: 'MONTHLY',
            revenue: entry.targetRevenue, cogs: entry.minTarget ?? 0,
            labor: 0, rent: 0, marketing: 0, other: 0,
            tenantId, createdBy: userId,
          },
        });
        created++;
      }
    }
    res.json({ success: true, created, updated });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /actuals ─────────────────────────────────
// Query: storeId (required), from, to, granularity (day|week|month)

budgetTrackerRouter.get('/actuals', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const storeId = String(req.query.storeId || '');
    if (!storeId) return res.status(400).json({ error: 'storeId ist erforderlich.' });

    const granularity = String(req.query.granularity || 'day');
    const from = String(req.query.from || '');
    const to = String(req.query.to || '');

    // Find all budget periods for this store
    const periodWhere: Record<string, unknown> = { tenantId, storeId, budgetType: 'MONTHLY' };
    const periods = await prisma.budgetPeriod.findMany({
      where: periodWhere,
      include: { actuals: { where: { category: 'REVENUE' }, orderBy: { date: 'asc' } } },
    });

    // Flatten all actuals
    let allActuals = periods.flatMap((p) =>
      p.actuals.map((a) => ({
        id: a.id,
        budgetPeriodId: a.budgetPeriodId,
        date: a.date,
        amount: a.actualAmount,
        description: a.description,
        enteredBy: a.enteredBy,
        createdAt: a.createdAt,
      }))
    );

    // Filter by date range
    if (from) allActuals = allActuals.filter((a) => a.date >= from);
    if (to) allActuals = allActuals.filter((a) => a.date <= to);

    // Sort by date
    allActuals.sort((a, b) => a.date.localeCompare(b.date));

    if (granularity === 'day') {
      res.json(allActuals);
    } else if (granularity === 'week') {
      // Group by ISO week
      const grouped = new Map<string, { week: number; year: string; total: number; days: number }>();
      for (const a of allActuals) {
        const wk = isoWeek(a.date);
        const yr = a.date.slice(0, 4);
        const key = `${yr}-W${String(wk).padStart(2, '0')}`;
        const existing = grouped.get(key);
        if (existing) {
          existing.total += a.amount;
          existing.days++;
        } else {
          grouped.set(key, { week: wk, year: yr, total: a.amount, days: 1 });
        }
      }
      res.json(Array.from(grouped.entries()).map(([key, val]) => ({ key, ...val })));
    } else {
      // Group by month
      const grouped = new Map<string, { total: number; days: number }>();
      for (const a of allActuals) {
        const key = a.date.slice(0, 7);
        const existing = grouped.get(key);
        if (existing) {
          existing.total += a.amount;
          existing.days++;
        } else {
          grouped.set(key, { total: a.amount, days: 1 });
        }
      }
      res.json(Array.from(grouped.entries()).map(([period, val]) => ({ period, ...val })));
    }
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /actuals ────────────────────────────────

budgetTrackerRouter.post('/actuals', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const parsed = actualCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const { storeId, date, amount, description } = parsed.data;
    const period = date.slice(0, 7); // "2025-03-15" -> "2025-03"

    // Find or create budget period
    let budgetPeriod = await prisma.budgetPeriod.findFirst({
      where: { storeId, period, budgetType: 'MONTHLY', tenantId },
    });

    if (!budgetPeriod) {
      budgetPeriod = await prisma.budgetPeriod.create({
        data: {
          storeId, period, budgetType: 'MONTHLY',
          revenue: 0, cogs: 0, labor: 0, rent: 0, marketing: 0, other: 0,
          tenantId, createdBy: userId,
        },
      });
    }

    // Check if actual for this date already exists (upsert)
    const existingActual = await prisma.budgetActual.findFirst({
      where: { budgetPeriodId: budgetPeriod.id, category: 'REVENUE', date },
    });

    let actual;
    if (existingActual) {
      actual = await prisma.budgetActual.update({
        where: { id: existingActual.id },
        data: { actualAmount: amount, description },
      });
    } else {
      actual = await prisma.budgetActual.create({
        data: {
          budgetPeriodId: budgetPeriod.id,
          category: 'REVENUE',
          actualAmount: amount,
          date,
          description,
          enteredBy: userId,
        },
      });
    }

    res.status(201).json({
      id: actual.id,
      date: actual.date,
      amount: actual.actualAmount,
      description: actual.description,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /actuals/:id ─────────────────────────────

budgetTrackerRouter.put('/actuals/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = actualUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.' });

    // Verify ownership via budget period
    const actual = await prisma.budgetActual.findUnique({
      where: { id: req.params.id },
      include: { budgetPeriod: { select: { tenantId: true } } },
    });
    if (!actual || actual.budgetPeriod.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden.' });
    }

    const updated = await prisma.budgetActual.update({
      where: { id: req.params.id },
      data: { actualAmount: parsed.data.amount, description: parsed.data.description },
    });
    res.json({ id: updated.id, date: updated.date, amount: updated.actualAmount, description: updated.description });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /forecast ────────────────────────────────
// Query: storeId (required), month (YYYY-MM, default: current)

budgetTrackerRouter.get('/forecast', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const storeId = String(req.query.storeId || '');
    if (!storeId) return res.status(400).json({ error: 'storeId ist erforderlich.' });

    const month = String(req.query.month || currentMonth());
    const { year, month: m } = parsePeriod(month);
    const totalDays = daysInMonth(year, m);
    const today = todayStr();
    const { from, to } = monthRange(month);

    // Is this the current month?
    const isCurrentMonth = month === currentMonth();
    const dayOfMonth = isCurrentMonth ? new Date().getDate() : totalDays;
    const elapsedDays = Math.min(dayOfMonth, totalDays);
    const remainingDays = totalDays - elapsedDays;

    // Get target
    const target = await prisma.budgetPeriod.findFirst({
      where: { storeId, period: month, budgetType: 'MONTHLY', tenantId },
      include: {
        store: { select: { id: true, name: true, city: true } },
        actuals: { where: { category: 'REVENUE' }, orderBy: { date: 'asc' } },
      },
    });

    const targetRevenue = target?.revenue ?? 0;
    const minTarget = target?.cogs ?? 0; // repurposed field

    // Calculate actuals sum
    const actuals = target?.actuals ?? [];
    const actualsInRange = actuals.filter((a) => a.date >= from && a.date <= to);
    const totalActual = actualsInRange.reduce((sum, a) => sum + a.actualAmount, 0);
    const daysWithData = actualsInRange.length;

    // Hochrechnung (forecast projection)
    const dailyAvg = daysWithData > 0 ? totalActual / daysWithData : 0;
    const projection = totalActual + dailyAvg * remainingDays;

    // Zielerreichung
    const achievementPercent = targetRevenue > 0 ? Math.round((totalActual / targetRevenue) * 10000) / 100 : 0;
    const projectedAchievement = targetRevenue > 0 ? Math.round((projection / targetRevenue) * 10000) / 100 : 0;
    const minAchievement = minTarget > 0 ? Math.round((totalActual / minTarget) * 10000) / 100 : 0;

    // Ampel logic
    let ampel: 'gruen' | 'gelb' | 'rot' = 'gruen';
    const expectedProgress = targetRevenue > 0 ? (elapsedDays / totalDays) * 100 : 0;
    const actualProgress = achievementPercent;

    if (actualProgress < expectedProgress * 0.85) {
      ampel = 'rot';
    } else if (actualProgress < expectedProgress * 0.95) {
      ampel = 'gelb';
    }

    // Daily breakdown for chart
    const dailyData: { date: string; soll: number; ist: number; cumSoll: number; cumIst: number }[] = [];
    const dailySoll = targetRevenue / totalDays;
    let cumSoll = 0;
    let cumIst = 0;

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${month}-${String(d).padStart(2, '0')}`;
      cumSoll += dailySoll;
      const dayActual = actualsInRange.find((a) => a.date === dateStr);
      if (dayActual) cumIst += dayActual.actualAmount;

      dailyData.push({
        date: dateStr,
        soll: Math.round(dailySoll * 100) / 100,
        ist: dayActual?.actualAmount ?? 0,
        cumSoll: Math.round(cumSoll * 100) / 100,
        cumIst: Math.round(cumIst * 100) / 100,
      });
    }

    // Weekly breakdown
    const weeklyMap = new Map<number, { soll: number; ist: number }>();
    for (const dd of dailyData) {
      const wk = isoWeek(dd.date);
      const existing = weeklyMap.get(wk) ?? { soll: 0, ist: 0 };
      existing.soll += dd.soll;
      existing.ist += dd.ist;
      weeklyMap.set(wk, existing);
    }
    const weeklyData = Array.from(weeklyMap.entries()).map(([week, val]) => ({
      week,
      soll: Math.round(val.soll * 100) / 100,
      ist: Math.round(val.ist * 100) / 100,
    }));

    // Alert messages
    const alerts: { type: 'warning' | 'success' | 'danger'; message: string }[] = [];
    if (minTarget > 0 && projection < minTarget) {
      alerts.push({ type: 'danger', message: `Hochrechnung (${Math.round(projection).toLocaleString('de-DE')} EUR) liegt unter Mindestziel (${Math.round(minTarget).toLocaleString('de-DE')} EUR).` });
    }
    if (projectedAchievement > 100) {
      alerts.push({ type: 'success', message: `Zielerreichung voraussichtlich ${projectedAchievement.toFixed(1)}% — Uebererfuellung erwartet.` });
    }

    res.json({
      storeId,
      storeName: target?.store?.name ?? '',
      month,
      targetRevenue,
      minTarget,
      totalActual: Math.round(totalActual * 100) / 100,
      daysWithData,
      totalDays,
      elapsedDays,
      remainingDays,
      dailyAvg: Math.round(dailyAvg * 100) / 100,
      projection: Math.round(projection * 100) / 100,
      achievementPercent,
      projectedAchievement,
      minAchievement,
      ampel,
      alerts,
      dailyData,
      weeklyData,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /dashboard ───────────────────────────────
// Multi-store comparison, ranking, region totals

budgetTrackerRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const month = String(req.query.month || currentMonth());
    const { year, month: m } = parsePeriod(month);
    const totalDays = daysInMonth(year, m);
    const isCurrentMonth = month === currentMonth();
    const elapsedDays = isCurrentMonth ? Math.min(new Date().getDate(), totalDays) : totalDays;
    const remainingDays = totalDays - elapsedDays;

    // Get all budget periods for this month
    const where: Record<string, unknown> = { tenantId, budgetType: 'MONTHLY', period: month };
    if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const periods = await prisma.budgetPeriod.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, city: true } },
        actuals: { where: { category: 'REVENUE' }, orderBy: { date: 'asc' } },
      },
    });

    // Per-store stats
    const stores = periods.map((p) => {
      const totalActual = p.actuals.reduce((sum, a) => sum + a.actualAmount, 0);
      const daysWithData = p.actuals.length;
      const dailyAvg = daysWithData > 0 ? totalActual / daysWithData : 0;
      const projection = totalActual + dailyAvg * remainingDays;
      const achievementPercent = p.revenue > 0 ? Math.round((totalActual / p.revenue) * 10000) / 100 : 0;
      const projectedAchievement = p.revenue > 0 ? Math.round((projection / p.revenue) * 10000) / 100 : 0;

      let ampel: 'gruen' | 'gelb' | 'rot' = 'gruen';
      const expectedProgress = p.revenue > 0 ? (elapsedDays / totalDays) * 100 : 0;
      if (achievementPercent < expectedProgress * 0.85) ampel = 'rot';
      else if (achievementPercent < expectedProgress * 0.95) ampel = 'gelb';

      return {
        storeId: p.storeId,
        storeName: p.store?.name ?? '',
        storeCity: p.store?.city ?? '',
        targetRevenue: p.revenue,
        minTarget: p.cogs,
        totalActual: Math.round(totalActual * 100) / 100,
        projection: Math.round(projection * 100) / 100,
        achievementPercent,
        projectedAchievement,
        ampel,
        daysWithData,
      };
    });

    // Sort by achievement (ranking)
    const ranking = [...stores].sort((a, b) => b.achievementPercent - a.achievementPercent);

    // Region totals
    const regionTarget = stores.reduce((s, st) => s + st.targetRevenue, 0);
    const regionActual = stores.reduce((s, st) => s + st.totalActual, 0);
    const regionProjection = stores.reduce((s, st) => s + st.projection, 0);
    const regionAchievement = regionTarget > 0 ? Math.round((regionActual / regionTarget) * 10000) / 100 : 0;
    const regionProjectedAchievement = regionTarget > 0 ? Math.round((regionProjection / regionTarget) * 10000) / 100 : 0;

    // Monthly trend: last 6 months
    const trendMonths: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, m - 1 - i, 1);
      trendMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const trendWhere: Record<string, unknown> = {
      tenantId, budgetType: 'MONTHLY', period: { in: trendMonths },
    };
    if (toolStoreIds !== 'all') trendWhere['storeId'] = { in: toolStoreIds };

    const trendPeriods = await prisma.budgetPeriod.findMany({
      where: trendWhere,
      include: { actuals: { where: { category: 'REVENUE' } } },
    });

    const trend = trendMonths.map((mo) => {
      const monthPeriods = trendPeriods.filter((p) => p.period === mo);
      const target = monthPeriods.reduce((s, p) => s + p.revenue, 0);
      const actual = monthPeriods.reduce((s, p) => s + p.actuals.reduce((s2, a) => s2 + a.actualAmount, 0), 0);
      const achievement = target > 0 ? Math.round((actual / target) * 10000) / 100 : 0;
      return { month: mo, target, actual, achievement };
    });

    res.json({
      month,
      totalDays,
      elapsedDays,
      storeCount: stores.length,
      ranking,
      region: {
        targetRevenue: regionTarget,
        totalActual: Math.round(regionActual * 100) / 100,
        projection: Math.round(regionProjection * 100) / 100,
        achievementPercent: regionAchievement,
        projectedAchievement: regionProjectedAchievement,
      },
      trend,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
