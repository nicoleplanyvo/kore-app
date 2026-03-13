import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { teamMessageCreateSchema } from '@shared/validators';

export const teamPushRouter: RouterType = Router();
teamPushRouter.use(authenticate, requireToolAccess('komm.team_push'));

// GET /messages — List messages for tenant
teamPushRouter.get('/messages', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = { tenantId };

    const [data, total] = await Promise.all([
      prisma.teamMessage.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true } },
          _count: { select: { reads: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.teamMessage.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /messages — Create message
teamPushRouter.post('/messages', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const userId = req.user!.sub;
    const parsed = teamMessageCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const message = await prisma.teamMessage.create({
      data: { ...parsed.data, tenantId, sentBy: userId },
    });
    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /reports/reach — Calculate reach rate
teamPushRouter.get('/reports/reach', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const messages = await prisma.teamMessage.findMany({
      where: { tenantId },
      include: { _count: { select: { reads: true } } },
    });
    const totalMessages = messages.length;
    const totalReads = messages.reduce((sum, m) => sum + m._count.reads, 0);
    res.json({ totalMessages, totalReads, avgReach: totalMessages > 0 ? Math.round((totalReads / totalMessages) * 100) / 100 : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /messages/:id — Get single with reads count
teamPushRouter.get('/messages/:id', async (req, res) => {
  try {
    const message = await prisma.teamMessage.findUnique({
      where: { id: req.params['id'] },
      include: {
        sender: { select: { id: true, name: true } },
        reads: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!message) return res.status(404).json({ error: 'Nachricht nicht gefunden.' });
    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /messages/:id/read — Mark as read
teamPushRouter.post('/messages/:id/read', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const read = await prisma.teamMessageRead.upsert({
      where: { messageId_userId: { messageId: req.params['id']!, userId } },
      create: { messageId: req.params['id']!, userId },
      update: { readAt: new Date() },
    });
    res.status(201).json(read);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
