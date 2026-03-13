import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { briefingCreateSchema, briefingUpdateSchema } from '@shared/validators';

export const briefingsRouter: RouterType = Router();
briefingsRouter.use(authenticate, requireToolAccess('komm.briefings'));

// GET / — List briefings for toolStoreIds
briefingsRouter.get('/', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const [data, total] = await Promise.all([
      prisma.briefing.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
          _count: { select: { acknowledgments: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.briefing.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST / — Create briefing
briefingsRouter.post('/', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const userId = req.user!.sub;
    const parsed = briefingCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const storeId = (req.body.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId ist erforderlich.' });

    const briefing = await prisma.briefing.create({
      data: { ...parsed.data, storeId, createdBy: userId },
    });
    res.status(201).json(briefing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /reports/read-rate — Calculate read rate across briefings
briefingsRouter.get('/reports/read-rate', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const briefings = await prisma.briefing.findMany({
      where,
      include: { _count: { select: { acknowledgments: true } } },
    });
    const total = briefings.length;
    const totalAcks = briefings.reduce((sum, b) => sum + b._count.acknowledgments, 0);
    res.json({ totalBriefings: total, totalAcknowledgments: totalAcks, avgReadRate: total > 0 ? Math.round((totalAcks / total) * 100) / 100 : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /:id — Get single briefing
briefingsRouter.get('/:id', async (req, res) => {
  try {
    const briefing = await prisma.briefing.findUnique({
      where: { id: req.params['id'] },
      include: {
        creator: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        acknowledgments: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!briefing) return res.status(404).json({ error: 'Briefing nicht gefunden.' });
    res.json(briefing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /:id — Update briefing
briefingsRouter.put('/:id', async (req, res) => {
  try {
    const parsed = briefingUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const briefing = await prisma.briefing.update({ where: { id: req.params['id'] }, data: parsed.data });
    res.json(briefing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /:id/acknowledge — Acknowledge briefing
briefingsRouter.post('/:id/acknowledge', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const ack = await prisma.briefingAcknowledgment.upsert({
      where: { briefingId_userId: { briefingId: req.params['id']!, userId } },
      create: { briefingId: req.params['id']!, userId },
      update: { readAt: new Date() },
    });
    res.status(201).json(ack);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
