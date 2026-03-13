import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { trainingLogCreateSchema, trainingLogUpdateSchema } from '@shared/validators';

export const trainingHoursRouter: RouterType = Router();
trainingHoursRouter.use(authenticate, requireToolAccess('training.training_hours'));

// GET /stores
trainingHoursRouter.get('/stores', async (req, res) => {
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

// GET /logs
trainingHoursRouter.get('/logs', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 30));
    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.category) where['category'] = req.query.category;
    if (req.query.userId) where['userId'] = req.query.userId;

    const [data, total] = await Promise.all([
      prisma.trainingLog.findMany({
        where,
        include: { user: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
        orderBy: { date: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.trainingLog.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /logs
trainingHoursRouter.post('/logs', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = trainingLogCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const log = await prisma.trainingLog.create({ data: { ...parsed.data, tenantId } });
    res.status(201).json(log);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /logs/:id
trainingHoursRouter.put('/logs/:id', async (req, res) => {
  try {
    const parsed = trainingLogUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const log = await prisma.trainingLog.update({ where: { id: req.params['id'] }, data: parsed.data });
    res.json(log);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /summary
trainingHoursRouter.get('/summary', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const agg = await prisma.trainingLog.aggregate({ where, _sum: { durationMinutes: true }, _count: true });
    const byCategory = await prisma.trainingLog.groupBy({ by: ['category'], where, _sum: { durationMinutes: true }, _count: true });
    res.json({
      totalMinutes: agg._sum.durationMinutes ?? 0,
      totalLogs: agg._count,
      byCategory: byCategory.map(c => ({ category: c.category, minutes: c._sum.durationMinutes ?? 0, count: c._count })),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
