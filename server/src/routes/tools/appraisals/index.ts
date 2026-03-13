import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { appraisalCycleCreateSchema, appraisalCreateSchema, appraisalUpdateSchema } from '@shared/validators';

export const appraisalsRouter: RouterType = Router();
appraisalsRouter.use(authenticate, requireToolAccess('coaching.appraisals'));

// GET /cycles
appraisalsRouter.get('/cycles', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const cycles = await prisma.appraisalCycle.findMany({
      where: { tenantId },
      include: { _count: { select: { appraisals: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(cycles);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /cycles
appraisalsRouter.post('/cycles', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = appraisalCycleCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const cycle = await prisma.appraisalCycle.create({ data: { ...parsed.data, tenantId } });
    res.status(201).json(cycle);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /appraisals
appraisalsRouter.get('/appraisals', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { cycle: { tenantId } };
    if (req.query.cycleId) where['cycleId'] = req.query.cycleId;
    if (req.query.status) where['status'] = req.query.status;
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const [data, total] = await Promise.all([
      prisma.appraisal.findMany({
        where,
        include: {
          cycle: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
          employee: { select: { id: true, name: true } },
          manager: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.appraisal.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /appraisals
appraisalsRouter.post('/appraisals', async (req, res) => {
  try {
    const parsed = appraisalCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const appraisal = await prisma.appraisal.create({ data: parsed.data });
    res.status(201).json(appraisal);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /appraisals/:id
appraisalsRouter.get('/appraisals/:id', async (req, res) => {
  try {
    const appraisal = await prisma.appraisal.findUnique({
      where: { id: req.params['id'] },
      include: {
        cycle: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });
    if (!appraisal) return res.status(404).json({ error: 'Appraisal nicht gefunden.' });
    res.json(appraisal);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /appraisals/:id
appraisalsRouter.put('/appraisals/:id', async (req, res) => {
  try {
    const parsed = appraisalUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const data: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === 'COMPLETED') data['completedAt'] = new Date();
    const appraisal = await prisma.appraisal.update({ where: { id: req.params['id'] }, data });
    res.json(appraisal);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
