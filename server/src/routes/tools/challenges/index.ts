import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { challengeCreateSchema, challengeUpdateSchema, challengeProgressSchema } from '@shared/validators';

export const challengesRouter: RouterType = Router();
challengesRouter.use(authenticate, requireToolAccess('training.challenges'));

// GET /
challengesRouter.get('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };
    if (req.query.status) where['status'] = req.query.status;

    const [data, total] = await Promise.all([
      prisma.challenge.findMany({
        where, include: { _count: { select: { participants: true } } },
        orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.challenge.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /
challengesRouter.post('/', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = challengeCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const challenge = await prisma.challenge.create({ data: { ...parsed.data, tenantId, createdBy: userId } });
    res.status(201).json(challenge);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// GET /:id (with leaderboard)
challengesRouter.get('/:id', async (req, res) => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params['id'] },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true } }, store: { select: { id: true, name: true } } },
          orderBy: { currentValue: 'desc' },
        },
      },
    });
    if (!challenge) return res.status(404).json({ error: 'Challenge nicht gefunden.' });
    res.json(challenge);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /:id
challengesRouter.put('/:id', async (req, res) => {
  try {
    const parsed = challengeUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const challenge = await prisma.challenge.update({ where: { id: req.params['id'] }, data: parsed.data });
    res.json(challenge);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// POST /:id/join
challengesRouter.post('/:id/join', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const storeId = req.body.storeId ?? null;
    const participant = await prisma.challengeParticipant.create({
      data: { challengeId: req.params['id']!, userId, storeId },
    });
    res.status(201).json(participant);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// PUT /:id/progress
challengesRouter.put('/:id/progress', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const parsed = challengeProgressSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungültige Daten.', details: parsed.error.flatten() });
    const participant = await prisma.challengeParticipant.update({
      where: { challengeId_userId: { challengeId: req.params['id']!, userId } },
      data: { currentValue: parsed.data.currentValue },
    });
    res.json(participant);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});
