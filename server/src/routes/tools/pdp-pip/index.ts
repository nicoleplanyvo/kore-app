import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { developmentPlanCreateSchema, developmentGoalCreateSchema, developmentGoalUpdateSchema, developmentReviewCreateSchema } from '@shared/validators';

export const pdpPipRouter: RouterType = Router();
pdpPipRouter.use(authenticate, requireToolAccess('coaching.pdp_pip'));

// GET /plans
pdpPipRouter.get('/plans', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.type) where['type'] = req.query.type;
    if (req.query.status) where['status'] = req.query.status;

    const [data, total] = await Promise.all([
      prisma.developmentPlan.findMany({
        where,
        include: {
          user: { select: { id: true, name: true } },
          manager: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
          _count: { select: { goals: true, reviews: true } },
        },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.developmentPlan.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /plans
pdpPipRouter.post('/plans', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const managerId = req.user!.sub;
    const parsed = developmentPlanCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const plan = await prisma.developmentPlan.create({ data: { ...parsed.data, tenantId, managerId } });
    res.status(201).json(plan);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /plans/:id
pdpPipRouter.get('/plans/:id', async (req, res) => {
  try {
    const plan = await prisma.developmentPlan.findUnique({
      where: { id: req.params['id'] },
      include: {
        user: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        goals: { orderBy: { createdAt: 'asc' } },
        reviews: { include: { reviewer: { select: { id: true, name: true } } }, orderBy: { reviewDate: 'desc' } },
      },
    });
    if (!plan) return res.status(404).json({ error: 'Plan nicht gefunden.' });
    res.json(plan);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /plans/:id/goals
pdpPipRouter.post('/plans/:id/goals', async (req, res) => {
  try {
    const parsed = developmentGoalCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const goal = await prisma.developmentGoal.create({ data: { ...parsed.data, planId: req.params['id']! } });
    res.status(201).json(goal);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /plans/:pid/goals/:gid
pdpPipRouter.put('/plans/:pid/goals/:gid', async (req, res) => {
  try {
    const parsed = developmentGoalUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const goal = await prisma.developmentGoal.update({ where: { id: req.params['gid'] }, data: parsed.data });
    res.json(goal);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /plans/:id/reviews
pdpPipRouter.post('/plans/:id/reviews', async (req, res) => {
  try {
    const reviewedBy = req.user!.sub;
    const parsed = developmentReviewCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const review = await prisma.developmentReview.create({ data: { ...parsed.data, planId: req.params['id']!, reviewedBy } });
    res.status(201).json(review);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
