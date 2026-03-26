import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { handoverCreateSchema, handoverUpdateSchema } from '@shared/validators';

export const handoverRouter: RouterType = Router();
handoverRouter.use(authenticate, requireToolAccess('komm.handover'));

const handoverInclude = {
  fromUser: { select: { id: true, name: true } },
  toUser: { select: { id: true, name: true } },
  store: { select: { id: true, name: true } },
};

// GET /stores — list stores the user has access to
handoverRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };

    const stores = await prisma.store.findMany({
      where,
      select: { id: true, name: true, city: true },
      orderBy: { name: 'asc' },
    });
    res.json(stores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /users — list users for a store (for recipient selection)
handoverRouter.get('/users', async (req, res) => {
  try {
    const storeId = req.query.storeId as string;
    if (!storeId) return res.status(400).json({ error: 'storeId ist erforderlich.' });

    const assignments = await prisma.userStoreAssignment.findMany({
      where: { storeId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
      },
    });

    const users = assignments
      .map((a) => a.user)
      .filter((u) => u.isActive)
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /dashboard — KPI dashboard
handoverRouter.get('/dashboard', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    if (req.query.from || req.query.to) {
      where['shiftDate'] = {};
      if (req.query.from) (where['shiftDate'] as Record<string, unknown>)['gte'] = req.query.from;
      if (req.query.to) (where['shiftDate'] as Record<string, unknown>)['lte'] = req.query.to;
    }

    const [total, draft, submitted, acknowledged, allHandovers] = await Promise.all([
      prisma.handover.count({ where }),
      prisma.handover.count({ where: { ...where, status: 'DRAFT' } }),
      prisma.handover.count({ where: { ...where, status: 'SUBMITTED' } }),
      prisma.handover.count({ where: { ...where, status: 'ACKNOWLEDGED' } }),
      prisma.handover.findMany({
        where: { ...where, status: { in: ['SUBMITTED', 'ACKNOWLEDGED'] } },
        select: { id: true, status: true, createdAt: true, updatedAt: true },
        orderBy: { shiftDate: 'desc' },
      }),
    ]);

    // Calculate average acknowledgement time (for ACKNOWLEDGED handovers)
    const acknowledgedHandovers = allHandovers.filter((h) => h.status === 'ACKNOWLEDGED');
    let avgAckTimeMinutes = 0;
    if (acknowledgedHandovers.length > 0) {
      const totalMs = acknowledgedHandovers.reduce((sum, h) => {
        return sum + (new Date(h.updatedAt).getTime() - new Date(h.createdAt).getTime());
      }, 0);
      avgAckTimeMinutes = Math.round(totalMs / acknowledgedHandovers.length / 60000);
    }

    // Compliance: % acknowledged within 2 hours
    const within2h = acknowledgedHandovers.filter((h) => {
      const diff = new Date(h.updatedAt).getTime() - new Date(h.createdAt).getTime();
      return diff <= 2 * 60 * 60 * 1000;
    }).length;
    const complianceRate =
      total > 0 ? Math.round((acknowledged / total) * 100) : 0;
    const fastAckRate =
      acknowledgedHandovers.length > 0 ? Math.round((within2h / acknowledgedHandovers.length) * 100) : 0;

    // Unacknowledged list
    const unacknowledged = await prisma.handover.findMany({
      where: { ...where, status: 'SUBMITTED' },
      include: handoverInclude,
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    res.json({
      total,
      draft,
      submitted,
      acknowledged,
      avgAckTimeMinutes,
      complianceRate,
      fastAckRate,
      unacknowledged,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET / — List handovers with filters
handoverRouter.get('/', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = {};

    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    if (req.query.status) where['status'] = req.query.status;

    if (req.query.from || req.query.to) {
      where['shiftDate'] = {};
      if (req.query.from) (where['shiftDate'] as Record<string, unknown>)['gte'] = req.query.from;
      if (req.query.to) (where['shiftDate'] as Record<string, unknown>)['lte'] = req.query.to;
    }

    if (req.query.userId) {
      where['OR'] = [{ fromUserId: req.query.userId }, { toUserId: req.query.userId }];
    }

    const [data, total] = await Promise.all([
      prisma.handover.findMany({
        where,
        include: handoverInclude,
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

    if (toolStoreIds !== 'all' && !toolStoreIds.includes(storeId)) {
      return res.status(403).json({ error: 'Kein Zugriff auf diesen Store.' });
    }

    const handover = await prisma.handover.create({
      data: { ...parsed.data, storeId, fromUserId: userId },
      include: handoverInclude,
    });
    res.status(201).json(handover);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// GET /:id — Get single handover with user names
handoverRouter.get('/:id', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const handover = await prisma.handover.findUnique({
      where: { id: req.params['id'] },
      include: handoverInclude,
    });
    if (!handover) return res.status(404).json({ error: 'Handover nicht gefunden.' });

    if (toolStoreIds !== 'all' && !toolStoreIds.includes(handover.storeId)) {
      return res.status(403).json({ error: 'Kein Zugriff.' });
    }

    res.json(handover);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// PUT /:id — Update handover (only DRAFT, only creator)
handoverRouter.put('/:id', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const existing = await prisma.handover.findUnique({ where: { id: req.params['id'] } });
    if (!existing) return res.status(404).json({ error: 'Handover nicht gefunden.' });
    if (existing.status !== 'DRAFT') return res.status(400).json({ error: 'Nur Entwuerfe können bearbeitet werden.' });
    if (existing.fromUserId !== userId) return res.status(403).json({ error: 'Nur der Ersteller kann bearbeiten.' });

    const parsed = handoverUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const handover = await prisma.handover.update({
      where: { id: req.params['id'] },
      data: parsed.data,
      include: handoverInclude,
    });
    res.json(handover);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /:id/submit — Change status from DRAFT to SUBMITTED
handoverRouter.post('/:id/submit', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const existing = await prisma.handover.findUnique({ where: { id: req.params['id'] } });
    if (!existing) return res.status(404).json({ error: 'Handover nicht gefunden.' });
    if (existing.status !== 'DRAFT') return res.status(400).json({ error: 'Nur Entwuerfe können eingereicht werden.' });
    if (existing.fromUserId !== userId) return res.status(403).json({ error: 'Nur der Ersteller kann einreichen.' });

    const handover = await prisma.handover.update({
      where: { id: req.params['id'] },
      data: { status: 'SUBMITTED' },
      include: handoverInclude,
    });
    res.json(handover);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// POST /:id/acknowledge — Acknowledge handover (set to ACKNOWLEDGED)
handoverRouter.post('/:id/acknowledge', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const existing = await prisma.handover.findUnique({ where: { id: req.params['id'] } });
    if (!existing) return res.status(404).json({ error: 'Handover nicht gefunden.' });
    if (existing.status !== 'SUBMITTED') return res.status(400).json({ error: 'Nur eingereichte Handovers können bestätigt werden.' });

    // Only recipient or store managers can acknowledge
    if (existing.toUserId && existing.toUserId !== userId) {
      const userRole = req.user!.role;
      if (!['kore_admin', 'tenant_admin', 'regional_manager', 'multisite_manager', 'store_manager'].includes(userRole)) {
        return res.status(403).json({ error: 'Nur der Empfänger oder Manager können bestätigen.' });
      }
    }

    const handover = await prisma.handover.update({
      where: { id: req.params['id'] },
      data: { status: 'ACKNOWLEDGED' },
      include: handoverInclude,
    });
    res.json(handover);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
