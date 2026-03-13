import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { handoverCreateSchema, handoverUpdateSchema } from '@shared/validators';

export const handoverRouter: RouterType = Router();
handoverRouter.use(authenticate, requireToolAccess('komm.handover'));

// GET / — List handovers for toolStoreIds
handoverRouter.get('/', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const [data, total] = await Promise.all([
      prisma.handover.findMany({
        where,
        include: {
          fromUser: { select: { id: true, name: true } },
          toUser: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
        },
        orderBy: { shiftDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.handover.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST / — Create handover
handoverRouter.post('/', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const userId = req.user!.sub;
    const parsed = handoverCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const storeId = (req.body.storeId as string) || (toolStoreIds !== 'all' ? toolStoreIds[0] : undefined);
    if (!storeId) return res.status(400).json({ error: 'storeId ist erforderlich.' });

    const handover = await prisma.handover.create({
      data: { ...parsed.data, storeId, fromUserId: userId },
    });
    res.status(201).json(handover);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /reports/summary — Summary stats
handoverRouter.get('/reports/summary', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const [total, draft, submitted, acknowledged] = await Promise.all([
      prisma.handover.count({ where }),
      prisma.handover.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.handover.count({ where: { ...where, status: 'SUBMITTED' } }),
      prisma.handover.count({ where: { ...where, status: 'ACKNOWLEDGED' } }),
    ]);
    res.json({ total, draft, submitted, acknowledged });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /:id — Get single handover
handoverRouter.get('/:id', async (req, res) => {
  try {
    const handover = await prisma.handover.findUnique({
      where: { id: req.params['id'] },
      include: {
        fromUser: { select: { id: true, name: true } },
        toUser: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
    });
    if (!handover) return res.status(404).json({ error: 'Handover nicht gefunden.' });
    res.json(handover);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /:id — Update handover
handoverRouter.put('/:id', async (req, res) => {
  try {
    const parsed = handoverUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });
    const handover = await prisma.handover.update({ where: { id: req.params['id'] }, data: parsed.data });
    res.json(handover);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /:id/acknowledge — Set status to ACKNOWLEDGED
handoverRouter.post('/:id/acknowledge', async (req, res) => {
  try {
    const handover = await prisma.handover.update({
      where: { id: req.params['id'] },
      data: { status: 'ACKNOWLEDGED' },
    });
    res.json(handover);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
