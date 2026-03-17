import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';

export const appraisalsRouter: RouterType = Router();
appraisalsRouter.use(authenticate, requireToolAccess('coaching.appraisals'));

/* ──────────────────────────────────────────
   Rating-Skala
   5 = Uebertrifft Erwartungen
   4 = Erreicht voll
   3 = Erreicht
   2 = Teilweise erreicht
   1 = Nicht erreicht
   ────────────────────────────────────────── */

const DEFAULT_CATEGORIES = [
  'Leistung',
  'Verhalten',
  'Fachkompetenz',
  'Teamarbeit',
  'Kundenfokus',
];

// ── GET /stores ──────────────────────────
appraisalsRouter.get('/stores', async (req, res) => {
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

// ── GET /users ───────────────────────────
appraisalsRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { tenantId, isActive: true };
    if (req.query.storeId) {
      where['storeAssignments'] = { some: { storeId: req.query.storeId as string } };
    }
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /categories ──────────────────────
appraisalsRouter.get('/categories', async (_req, res) => {
  res.json(DEFAULT_CATEGORIES);
});

// ── GET /appraisals ──────────────────────
appraisalsRouter.get('/appraisals', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 20));

    const where: Record<string, unknown> = { cycle: { tenantId } };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.userId) {
      where['OR'] = [{ employeeId: req.query.userId }, { managerId: req.query.userId }];
    }
    if (req.query.from || req.query.to) {
      const dateFilter: Record<string, unknown> = {};
      if (req.query.from) dateFilter['gte'] = new Date(req.query.from as string);
      if (req.query.to) dateFilter['lte'] = new Date(req.query.to as string);
      where['createdAt'] = dateFilter;
    }

    const [data, total] = await Promise.all([
      prisma.appraisal.findMany({
        where,
        include: {
          cycle: { select: { id: true, name: true, period: true } },
          store: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true } },
          manager: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.appraisal.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /appraisals ─────────────────────
appraisalsRouter.post('/appraisals', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = (req as any).userId as string;
    const { employeeId, storeId, templateName, dueDate, requestSelfAssessment } = req.body;

    if (!employeeId) return res.status(400).json({ error: 'Mitarbeiter muss ausgewaehlt werden.' });

    // Find or create an active cycle
    let cycle = await prisma.appraisalCycle.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!cycle) {
      const now = new Date();
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      cycle = await prisma.appraisalCycle.create({
        data: {
          tenantId,
          name: `Beurteilungszyklus ${now.getFullYear()}`,
          period: `${now.getFullYear()}`,
          startDate: now,
          endDate: endOfYear,
          status: 'ACTIVE',
        },
      });
    }

    const initialStatus = requestSelfAssessment ? 'SELF_REVIEW' : 'PENDING';

    // Store category ratings and goals as JSON in the strengths/improvements/goals/meetingNotes fields
    // We use the `goals` field for SMART goals JSON and `meetingNotes` for category ratings JSON
    const categories = DEFAULT_CATEGORIES;
    const ratingsJson = JSON.stringify({
      categories: categories.map(c => ({ name: c, managerRating: null, selfRating: null, comment: '' })),
      templateName: templateName || 'Standard',
      dueDate: dueDate || null,
      selfAssessmentRequested: !!requestSelfAssessment,
      selfAssessmentCompleted: false,
      smartGoals: [],
    });

    const appraisal = await prisma.appraisal.create({
      data: {
        cycleId: cycle.id,
        storeId: storeId || null,
        employeeId,
        managerId: userId,
        status: initialStatus,
        meetingNotes: ratingsJson,
      },
      include: {
        cycle: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(appraisal);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /appraisals/:id ──────────────────
appraisalsRouter.get('/appraisals/:id', async (req, res) => {
  try {
    const appraisal = await prisma.appraisal.findUnique({
      where: { id: req.params['id'] },
      include: {
        cycle: { select: { id: true, name: true, period: true } },
        store: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });
    if (!appraisal) return res.status(404).json({ error: 'Beurteilung nicht gefunden.' });

    // Parse the JSON data from meetingNotes
    let detail: any = {};
    try { detail = JSON.parse(appraisal.meetingNotes || '{}'); } catch { /* empty */ }

    res.json({
      ...appraisal,
      parsedDetail: {
        categories: detail.categories || DEFAULT_CATEGORIES.map((c: string) => ({ name: c, managerRating: null, selfRating: null, comment: '' })),
        templateName: detail.templateName || 'Standard',
        dueDate: detail.dueDate || null,
        selfAssessmentRequested: detail.selfAssessmentRequested ?? false,
        selfAssessmentCompleted: detail.selfAssessmentCompleted ?? false,
        smartGoals: detail.smartGoals || [],
      },
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── PUT /appraisals/:id ──────────────────
appraisalsRouter.put('/appraisals/:id', async (req, res) => {
  try {
    const existing = await prisma.appraisal.findUnique({ where: { id: req.params['id'] } });
    if (!existing) return res.status(404).json({ error: 'Beurteilung nicht gefunden.' });

    const { categories, smartGoals, strengths, improvements, goals, overallRating, managerRating, status } = req.body;

    let detail: any = {};
    try { detail = JSON.parse(existing.meetingNotes || '{}'); } catch { /* empty */ }

    if (categories) detail.categories = categories;
    if (smartGoals !== undefined) detail.smartGoals = smartGoals;

    const data: Record<string, unknown> = {
      meetingNotes: JSON.stringify(detail),
    };
    if (strengths !== undefined) data['strengths'] = strengths;
    if (improvements !== undefined) data['improvements'] = improvements;
    if (goals !== undefined) data['goals'] = goals;
    if (overallRating !== undefined) data['overallRating'] = overallRating;
    if (managerRating !== undefined) data['managerRating'] = managerRating;
    if (status) data['status'] = status;

    // Compute overall manager rating from categories if categories provided
    if (categories && Array.isArray(categories)) {
      const rated = categories.filter((c: any) => c.managerRating != null);
      if (rated.length > 0) {
        const avg = rated.reduce((s: number, c: any) => s + c.managerRating, 0) / rated.length;
        data['managerRating'] = Math.round(avg);
        data['overallRating'] = Math.round(avg);
      }
    }

    const appraisal = await prisma.appraisal.update({ where: { id: req.params['id'] }, data });
    res.json(appraisal);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /appraisals/:id/self-assessment ─
appraisalsRouter.post('/appraisals/:id/self-assessment', async (req, res) => {
  try {
    const existing = await prisma.appraisal.findUnique({ where: { id: req.params['id'] } });
    if (!existing) return res.status(404).json({ error: 'Beurteilung nicht gefunden.' });

    const { categories } = req.body;
    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ error: 'Kategorien muessen angegeben werden.' });
    }

    let detail: any = {};
    try { detail = JSON.parse(existing.meetingNotes || '{}'); } catch { /* empty */ }

    // Merge self-ratings into categories
    const existingCategories: any[] = detail.categories || [];
    for (const submitted of categories) {
      const found = existingCategories.find((c: any) => c.name === submitted.name);
      if (found) {
        found.selfRating = submitted.selfRating;
        found.selfComment = submitted.selfComment || '';
      }
    }
    detail.categories = existingCategories;
    detail.selfAssessmentCompleted = true;

    // Compute average self-rating
    const selfRated = existingCategories.filter((c: any) => c.selfRating != null);
    const selfAvg = selfRated.length > 0 ? Math.round(selfRated.reduce((s: number, c: any) => s + c.selfRating, 0) / selfRated.length) : null;

    const appraisal = await prisma.appraisal.update({
      where: { id: req.params['id'] },
      data: {
        meetingNotes: JSON.stringify(detail),
        selfRating: selfAvg,
        status: 'MANAGER_REVIEW',
      },
    });
    res.json(appraisal);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── POST /appraisals/:id/complete ────────
appraisalsRouter.post('/appraisals/:id/complete', async (req, res) => {
  try {
    const existing = await prisma.appraisal.findUnique({ where: { id: req.params['id'] } });
    if (!existing) return res.status(404).json({ error: 'Beurteilung nicht gefunden.' });

    const appraisal = await prisma.appraisal.update({
      where: { id: req.params['id'] },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
    res.json(appraisal);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /dashboard ───────────────────────
appraisalsRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';

    const baseWhere: Record<string, unknown> = { cycle: { tenantId } };
    if (req.query.storeId) baseWhere['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') baseWhere['storeId'] = { in: toolStoreIds };

    const allAppraisals = await prisma.appraisal.findMany({
      where: baseWhere,
      include: {
        store: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
        cycle: { select: { id: true, name: true, period: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = allAppraisals.length;
    const completed = allAppraisals.filter(a => a.status === 'COMPLETED').length;
    const pending = allAppraisals.filter(a => a.status === 'PENDING').length;
    const selfReview = allAppraisals.filter(a => a.status === 'SELF_REVIEW').length;
    const managerReview = allAppraisals.filter(a => a.status === 'MANAGER_REVIEW').length;

    // Overdue: not completed and dueDate < today
    const now = new Date();
    const overdue = allAppraisals.filter(a => {
      if (a.status === 'COMPLETED') return false;
      try {
        const detail = JSON.parse(a.meetingNotes || '{}');
        if (detail.dueDate) return new Date(detail.dueDate) < now;
      } catch { /* empty */ }
      return false;
    }).length;

    // Due soon: not completed and dueDate within next 7 days
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueSoon = allAppraisals.filter(a => {
      if (a.status === 'COMPLETED') return false;
      try {
        const detail = JSON.parse(a.meetingNotes || '{}');
        if (detail.dueDate) {
          const due = new Date(detail.dueDate);
          return due >= now && due <= sevenDays;
        }
      } catch { /* empty */ }
      return false;
    });

    // Average score
    const scored = allAppraisals.filter(a => a.overallRating != null);
    const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, a) => s + (a.overallRating ?? 0), 0) / scored.length * 10) / 10 : 0;

    // Category averages from completed appraisals
    const categoryTotals: Record<string, { sum: number; count: number }> = {};
    for (const a of allAppraisals.filter(x => x.status === 'COMPLETED')) {
      try {
        const detail = JSON.parse(a.meetingNotes || '{}');
        if (detail.categories) {
          for (const cat of detail.categories) {
            if (cat.managerRating != null) {
              if (!categoryTotals[cat.name]) categoryTotals[cat.name] = { sum: 0, count: 0 };
              categoryTotals[cat.name]!.sum += cat.managerRating;
              categoryTotals[cat.name]!.count += 1;
            }
          }
        }
      } catch { /* empty */ }
    }
    const categoryAverages = Object.entries(categoryTotals).map(([name, v]) => ({
      name,
      average: Math.round(v.sum / v.count * 10) / 10,
      count: v.count,
    }));

    // Trend by cycle
    const byCycle: Record<string, { name: string; sum: number; count: number }> = {};
    for (const a of allAppraisals.filter(x => x.overallRating != null)) {
      const key = a.cycleId;
      if (!byCycle[key]) byCycle[key] = { name: a.cycle?.name || key, sum: 0, count: 0 };
      byCycle[key].sum += a.overallRating!;
      byCycle[key].count += 1;
    }
    const trends = Object.values(byCycle).map(v => ({
      cycle: v.name,
      average: Math.round(v.sum / v.count * 10) / 10,
      count: v.count,
    }));

    // Store comparison
    const byStore: Record<string, { name: string; sum: number; count: number }> = {};
    for (const a of allAppraisals.filter(x => x.overallRating != null && x.storeId)) {
      const key = a.storeId!;
      if (!byStore[key]) byStore[key] = { name: a.store?.name || key, sum: 0, count: 0 };
      byStore[key].sum += a.overallRating!;
      byStore[key].count += 1;
    }
    const storeComparison = Object.values(byStore).map(v => ({
      store: v.name,
      average: Math.round(v.sum / v.count * 10) / 10,
      count: v.count,
    })).sort((a, b) => b.average - a.average);

    res.json({
      total,
      completed,
      pending,
      selfReview,
      managerReview,
      overdue,
      dueSoon: dueSoon.map(a => ({
        id: a.id,
        employeeName: a.employee?.name,
        storeName: a.store?.name,
        status: a.status,
      })),
      avgScore,
      categoryAverages,
      trends,
      storeComparison,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
