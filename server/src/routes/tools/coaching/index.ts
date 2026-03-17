import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import {
  coachingSessionCreateSchema,
  coachingSessionUpdateSchema,
  coachingTemplateCreateSchema,
} from '@shared/validators';

export const coachingRouter: RouterType = Router();
coachingRouter.use(authenticate, requireToolAccess('coaching.coaching'));

// ── GET /stores ─────────────────────────────────────
coachingRouter.get('/stores', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = { isActive: true };
    if (toolStoreIds !== 'all') where['id'] = { in: toolStoreIds };
    else if (tenantId) where['tenantId'] = tenantId;
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

// ── GET /users ──────────────────────────────────────
coachingRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const where: Record<string, unknown> = { isActive: true };
    if (tenantId) where['tenantId'] = tenantId;
    if (toolStoreIds !== 'all') {
      where['storeAssignments'] = { some: { storeId: { in: toolStoreIds } } };
    }
    const users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /sessions ───────────────────────────────────
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
    if (req.query.coachId) where['coachId'] = req.query.coachId;
    if (req.query.coacheeId) where['coacheeId'] = req.query.coacheeId;
    if (req.query.from || req.query.to) {
      const dateFilter: Record<string, unknown> = {};
      if (req.query.from) dateFilter['gte'] = new Date(req.query.from as string);
      if (req.query.to) dateFilter['lte'] = new Date(req.query.to as string);
      where['scheduledAt'] = dateFilter;
    }

    const [data, total] = await Promise.all([
      prisma.coachingSession.findMany({
        where,
        include: {
          store: { select: { id: true, name: true } },
          coach: { select: { id: true, name: true } },
          coachee: { select: { id: true, name: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.coachingSession.count({ where }),
    ]);
    res.json({ data, total, page, pageSize });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /sessions ──────────────────────────────────
coachingRouter.post('/sessions', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const coachId = req.user!.sub;
    const parsed = coachingSessionCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const session = await prisma.coachingSession.create({
      data: { ...parsed.data, tenantId, coachId, scheduledAt: new Date(parsed.data.scheduledAt), followUpDate: parsed.data.followUpDate ? new Date(parsed.data.followUpDate) : undefined },
      include: {
        store: { select: { id: true, name: true } },
        coach: { select: { id: true, name: true } },
        coachee: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /sessions/:id ───────────────────────────────
coachingRouter.get('/sessions/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const session = await prisma.coachingSession.findFirst({
      where: { id: req.params['id'], tenantId },
      include: {
        store: { select: { id: true, name: true } },
        coach: { select: { id: true, name: true } },
        coachee: { select: { id: true, name: true } },
      },
    });
    if (!session) return res.status(404).json({ error: 'Session nicht gefunden.' });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── PUT /sessions/:id ───────────────────────────────
coachingRouter.put('/sessions/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const parsed = coachingSessionUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const updateData: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.scheduledAt) updateData['scheduledAt'] = new Date(parsed.data.scheduledAt);
    if (parsed.data.followUpDate) updateData['followUpDate'] = new Date(parsed.data.followUpDate);

    const result = await prisma.coachingSession.updateMany({
      where: { id: req.params['id'], tenantId },
      data: updateData,
    });
    if (result.count === 0) return res.status(404).json({ error: 'Session nicht gefunden.' });

    const session = await prisma.coachingSession.findUnique({
      where: { id: req.params['id'] },
      include: {
        store: { select: { id: true, name: true } },
        coach: { select: { id: true, name: true } },
        coachee: { select: { id: true, name: true } },
      },
    });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── DELETE /sessions/:id ────────────────────────────
coachingRouter.delete('/sessions/:id', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const result = await prisma.coachingSession.deleteMany({
      where: { id: req.params['id'], tenantId },
    });
    if (result.count === 0) return res.status(404).json({ error: 'Session nicht gefunden.' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /templates ──────────────────────────────────
coachingRouter.get('/templates', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const templates = await prisma.coachingTemplate.findMany({
      where: { tenantId, isActive: true },
      include: { creator: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /templates ─────────────────────────────────
coachingRouter.post('/templates', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const createdBy = req.user!.sub;
    const parsed = coachingTemplateCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const template = await prisma.coachingTemplate.create({
      data: { ...parsed.data, tenantId, createdBy },
      include: { creator: { select: { id: true, name: true } } },
    });
    res.status(201).json(template);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /dashboard ──────────────────────────────────
coachingRouter.get('/dashboard', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeWhere: Record<string, unknown> = { tenantId };
    if (toolStoreIds !== 'all') storeWhere['storeId'] = { in: toolStoreIds };

    // Total sessions
    const totalSessions = await prisma.coachingSession.count({ where: storeWhere });
    const completedSessions = await prisma.coachingSession.count({ where: { ...storeWhere, status: 'COMPLETED' } });
    const scheduledSessions = await prisma.coachingSession.count({ where: { ...storeWhere, status: 'SCHEDULED' } });

    // Coaching quote: unique coachees with at least one session in last 90 days / total users in stores
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const recentSessions = await prisma.coachingSession.findMany({
      where: { ...storeWhere, scheduledAt: { gte: ninetyDaysAgo } },
      select: { coacheeId: true },
    });
    const uniqueCoachees = new Set(recentSessions.map((s) => s.coacheeId)).size;

    // Total active users for quote
    const userWhere: Record<string, unknown> = { isActive: true };
    if (tenantId) userWhere['tenantId'] = tenantId;
    if (toolStoreIds !== 'all') {
      userWhere['storeAssignments'] = { some: { storeId: { in: toolStoreIds } } };
    }
    const totalUsers = await prisma.user.count({ where: userWhere });
    const coachingQuote = totalUsers > 0 ? Math.round((uniqueCoachees / totalUsers) * 100) : 0;

    // Sessions per month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlySessions = await prisma.coachingSession.findMany({
      where: { ...storeWhere, scheduledAt: { gte: sixMonthsAgo } },
      select: { scheduledAt: true, status: true },
    });

    const monthlyMap: Record<string, { total: number; completed: number }> = {};
    for (const s of monthlySessions) {
      const key = `${s.scheduledAt.getFullYear()}-${String(s.scheduledAt.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { total: 0, completed: 0 };
      monthlyMap[key].total++;
      if (s.status === 'COMPLETED') monthlyMap[key].completed++;
    }
    const trend = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, counts]) => ({ month, ...counts }));

    // Top topics
    const allSessions = await prisma.coachingSession.findMany({
      where: storeWhere,
      select: { topic: true },
    });
    const topicMap: Record<string, number> = {};
    for (const s of allSessions) {
      if (s.topic) {
        topicMap[s.topic] = (topicMap[s.topic] || 0) + 1;
      }
    }
    const topics = Object.entries(topicMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));

    // Coach activity ranking
    const coachSessions = await prisma.coachingSession.findMany({
      where: { ...storeWhere, status: 'COMPLETED' },
      select: { coachId: true, coach: { select: { id: true, name: true } } },
    });
    const coachMap: Record<string, { name: string; count: number }> = {};
    for (const s of coachSessions) {
      if (!coachMap[s.coachId]) coachMap[s.coachId] = { name: s.coach.name, count: 0 };
      coachMap[s.coachId]!.count++;
    }
    const coachRanking = Object.entries(coachMap)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([id, data]) => ({ id, ...data }));

    // Store comparison
    const storeSessions = await prisma.coachingSession.findMany({
      where: storeWhere,
      select: { storeId: true, store: { select: { id: true, name: true } }, status: true },
    });
    const storeMap: Record<string, { name: string; total: number; completed: number }> = {};
    for (const s of storeSessions) {
      if (!storeMap[s.storeId]) storeMap[s.storeId] = { name: s.store.name, total: 0, completed: 0 };
      storeMap[s.storeId]!.total++;
      if (s.status === 'COMPLETED') storeMap[s.storeId]!.completed++;
    }
    const storeComparison = Object.entries(storeMap)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([id, data]) => ({ id, ...data }));

    res.json({
      totalSessions,
      completedSessions,
      scheduledSessions,
      coachingQuote,
      uniqueCoachees,
      totalUsers,
      trend,
      topics,
      coachRanking,
      storeComparison,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
