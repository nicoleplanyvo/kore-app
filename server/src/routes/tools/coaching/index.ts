import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { coachingSessionCreateSchema, coachingSessionUpdateSchema } from '@shared/validators';

export const coachingRouter: RouterType = Router();
coachingRouter.use(authenticate, requireToolAccess('coaching.one_on_one'));

// GET /sessions
coachingRouter.get('/sessions', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.status) where['status'] = req.query.status;

    const [data, total] = await Promise.all([
      prisma.coachingSession.findMany({
        where,
        include: {
          store: { select: { id: true, name: true } },
          coach: { select: { id: true, name: true } },
          coachee: { select: { id: true, name: true } },
        },
        orderBy: { scheduledAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.coachingSession.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /sessions
coachingRouter.post('/sessions', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const coachId = req.user!.sub;
    const parsed = coachingSessionCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const session = await prisma.coachingSession.create({ data: { ...parsed.data, tenantId, coachId } });
    res.status(201).json(session);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /sessions/:id
coachingRouter.get('/sessions/:id', async (req, res) => {
  try {
    const session = await prisma.coachingSession.findUnique({
      where: { id: req.params['id'] },
      include: {
        store: { select: { id: true, name: true } },
        coach: { select: { id: true, name: true } },
        coachee: { select: { id: true, name: true } },
      },
    });
    if (!session) return res.status(404).json({ error: 'Session nicht gefunden.' });
    res.json(session);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /sessions/:id
coachingRouter.put('/sessions/:id', async (req, res) => {
  try {
    const parsed = coachingSessionUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const session = await prisma.coachingSession.update({ where: { id: req.params['id'] }, data: parsed.data });
    res.json(session);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
