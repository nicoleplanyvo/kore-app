import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { wellbeingCheckInCreateSchema, wellbeingResourceCreateSchema, wellbeingResourceUpdateSchema } from '@shared/validators';

export const wellbeingRouter: RouterType = Router();
wellbeingRouter.use(authenticate, requireToolAccess('coaching.wellbeing'));

// GET /checkins
wellbeingRouter.get('/checkins', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const [data, total] = await Promise.all([
      prisma.wellbeingCheckIn.findMany({
        where,
        include: { user: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.wellbeingCheckIn.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /checkins
wellbeingRouter.post('/checkins', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.body.isAnonymous ? null : req.user!.sub;
    const parsed = wellbeingCheckInCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const checkin = await prisma.wellbeingCheckIn.create({ data: { ...parsed.data, tenantId, userId } });
    res.status(201).json(checkin);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /resources
wellbeingRouter.get('/resources', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const resources = await prisma.wellbeingResource.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(resources);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /resources
wellbeingRouter.post('/resources', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = wellbeingResourceCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const resource = await prisma.wellbeingResource.create({ data: { ...parsed.data, tenantId } });
    res.status(201).json(resource);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /resources/:id
wellbeingRouter.put('/resources/:id', async (req, res) => {
  try {
    const parsed = wellbeingResourceUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const resource = await prisma.wellbeingResource.update({ where: { id: req.params['id'] }, data: parsed.data });
    res.json(resource);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /summary
wellbeingRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const agg = await prisma.wellbeingCheckIn.aggregate({
      where,
      _avg: { moodScore: true, energyLevel: true, stressLevel: true, workloadRating: true },
      _count: true,
    });
    res.json({
      totalCheckIns: agg._count,
      avgMood: agg._avg.moodScore ? Math.round(agg._avg.moodScore * 10) / 10 : null,
      avgEnergy: agg._avg.energyLevel ? Math.round(agg._avg.energyLevel * 10) / 10 : null,
      avgStress: agg._avg.stressLevel ? Math.round(agg._avg.stressLevel * 10) / 10 : null,
      avgWorkload: agg._avg.workloadRating ? Math.round(agg._avg.workloadRating * 10) / 10 : null,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
