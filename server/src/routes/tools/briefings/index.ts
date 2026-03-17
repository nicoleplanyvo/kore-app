import { Router, type Router as RouterType } from 'express';
import prisma from '../../../lib/prisma.js';
import { authenticate } from '../../../middleware/auth.js';
import { requireToolAccess } from '../../../middleware/requireToolAccess.js';
import { briefingCreateSchema, briefingUpdateSchema } from '@shared/validators';

export const briefingsRouter: RouterType = Router();
briefingsRouter.use(authenticate, requireToolAccess('komm.briefings'));

// ── GET /stores ──────────────────────────────────────
briefingsRouter.get('/stores', async (req, res) => {
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

// ── GET /users ───────────────────────────────────────
briefingsRouter.get('/users', async (req, res) => {
  try {
    const tenantId = (req as any).tenantId as string;
    const users = await prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /copy-last — Last briefing for a store (for copying) ─
briefingsRouter.get('/copy-last', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const storeId = req.query.storeId as string | undefined;
    const where: Record<string, unknown> = {};
    if (storeId) where['storeId'] = storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    const briefing = await prisma.briefing.findFirst({
      where,
      orderBy: { date: 'desc' },
      select: { id: true, title: true, content: true, sections: true, type: true },
    });
    if (!briefing) return res.status(404).json({ error: 'Kein vorheriges Briefing gefunden.' });
    res.json(briefing);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET /dashboard — Read rates, trends, store comparison ────
briefingsRouter.get('/dashboard', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const tenantId = (req as any).tenantId as string;
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };

    // All briefings for tenant stores
    const briefings = await prisma.briefing.findMany({
      where,
      include: {
        store: { select: { id: true, name: true } },
        _count: { select: { acknowledgments: true } },
      },
      orderBy: { date: 'desc' },
      take: 200,
    });

    // Count users per store for read-rate calculation
    const storeIds = [...new Set(briefings.map((b) => b.storeId))];
    const storeUserCounts: Record<string, number> = {};
    for (const sid of storeIds) {
      const count = await prisma.userStoreAssignment.count({ where: { storeId: sid } });
      storeUserCounts[sid] = Math.max(count, 1);
    }

    // Recent briefings with read rates
    const recentBriefings = briefings.slice(0, 30).map((b) => {
      const userCount = storeUserCounts[b.storeId] ?? 1;
      return {
        id: b.id,
        title: b.title,
        date: b.date,
        type: b.type,
        storeId: b.storeId,
        storeName: b.store?.name ?? '—',
        acks: b._count.acknowledgments,
        userCount,
        readRate: Math.round((b._count.acknowledgments / userCount) * 100),
      };
    });

    // Average read rate
    const allRates = briefings.map((b) => {
      const uc = storeUserCounts[b.storeId] ?? 1;
      return (b._count.acknowledgments / uc) * 100;
    });
    const avgReadRate = allRates.length > 0 ? Math.round(allRates.reduce((s, r) => s + r, 0) / allRates.length) : 0;

    // Briefing frequency: briefings per week (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    const recentCount = briefings.filter((b) => new Date(b.date) >= eightWeeksAgo).length;
    const briefingsPerWeek = Math.round((recentCount / 8) * 10) / 10;

    // Store comparison
    const storeMap = new Map<string, { storeName: string; count: number; totalRate: number }>();
    for (const b of briefings) {
      const key = b.storeId;
      const entry = storeMap.get(key) ?? { storeName: b.store?.name ?? '—', count: 0, totalRate: 0 };
      const uc = storeUserCounts[b.storeId] ?? 1;
      entry.count += 1;
      entry.totalRate += (b._count.acknowledgments / uc) * 100;
      storeMap.set(key, entry);
    }
    const storeComparison = [...storeMap.entries()].map(([storeId, v]) => ({
      storeId,
      storeName: v.storeName,
      briefingCount: v.count,
      avgReadRate: Math.round(v.totalRate / v.count),
    })).sort((a, b) => b.avgReadRate - a.avgReadRate);

    // Trend: last 12 dates with read rates
    const dateMap = new Map<string, { count: number; totalRate: number }>();
    for (const b of briefings) {
      const entry = dateMap.get(b.date) ?? { count: 0, totalRate: 0 };
      const uc = storeUserCounts[b.storeId] ?? 1;
      entry.count += 1;
      entry.totalRate += (b._count.acknowledgments / uc) * 100;
      dateMap.set(b.date, entry);
    }
    const trend = [...dateMap.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 14)
      .reverse()
      .map(([date, v]) => ({
        date,
        avgReadRate: Math.round(v.totalRate / v.count),
        briefingCount: v.count,
      }));

    res.json({
      avgReadRate,
      totalBriefings: briefings.length,
      briefingsPerWeek,
      recentBriefings,
      storeComparison,
      trend,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Interner Serverfehler.' }); }
});

// ── GET / — List briefings ───────────────────────────
briefingsRouter.get('/', async (req, res) => {
  try {
    const toolStoreIds = (req as any).toolStoreIds as string[] | 'all';
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const where: Record<string, unknown> = {};
    if (req.query.storeId) where['storeId'] = req.query.storeId;
    else if (toolStoreIds !== 'all') where['storeId'] = { in: toolStoreIds };
    if (req.query.from || req.query.to) {
      const dateFilter: Record<string, string> = {};
      if (req.query.from) dateFilter['gte'] = req.query.from as string;
      if (req.query.to) dateFilter['lte'] = req.query.to as string;
      where['date'] = dateFilter;
    }

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

// ── POST / — Create briefing ─────────────────────────
briefingsRouter.post('/', async (req, res) => {
  try {
    const userId = req.user!.sub;
    const parsed = briefingCreateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const { sections, storeId, title, content, date, type, scheduledFor } = parsed.data;
    const briefing = await prisma.briefing.create({
      data: {
        title,
        content: content || '',
        date: date || new Date().toISOString().slice(0, 10),
        type: type || 'MORNING',
        scheduledFor: scheduledFor || null,
        storeId: storeId!,
        sections: JSON.stringify(sections || []),
        createdBy: userId,
        publishedAt: scheduledFor ? null : new Date(),
      },
      include: {
        creator: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
      },
    });
    res.status(201).json(briefing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── GET /:id — Briefing detail with read status ──────
briefingsRouter.get('/:id', async (req, res) => {
  try {
    const briefing = await prisma.briefing.findUnique({
      where: { id: req.params['id'] },
      include: {
        creator: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        acknowledgments: { include: { user: { select: { id: true, name: true } } }, orderBy: { readAt: 'desc' } },
      },
    });
    if (!briefing) return res.status(404).json({ error: 'Briefing nicht gefunden.' });

    // Count users in this store for read-rate
    const userCount = await prisma.userStoreAssignment.count({ where: { storeId: briefing.storeId } });
    const readRate = userCount > 0 ? Math.round((briefing.acknowledgments.length / userCount) * 100) : 0;

    // Parse sections JSON
    let sections: unknown[] = [];
    try { sections = JSON.parse(briefing.sections); } catch { /* keep empty */ }

    res.json({ ...briefing, sections, userCount: Math.max(userCount, 1), readRate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── PUT /:id — Update briefing ───────────────────────
briefingsRouter.put('/:id', async (req, res) => {
  try {
    const parsed = briefingUpdateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Ungueltige Daten.', details: parsed.error.flatten() });

    const { sections, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = { ...rest };
    if (sections !== undefined) updateData['sections'] = JSON.stringify(sections);

    const briefing = await prisma.briefing.update({
      where: { id: req.params['id'] },
      data: updateData,
    });
    res.json(briefing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});

// ── POST /:id/read — Mark briefing as read ───────────
briefingsRouter.post('/:id/read', async (req, res) => {
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

// ── GET /:id/readers — Who read the briefing ─────────
briefingsRouter.get('/:id/readers', async (req, res) => {
  try {
    const acks = await prisma.briefingAcknowledgment.findMany({
      where: { briefingId: req.params['id'] },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { readAt: 'desc' },
    });
    res.json(acks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interner Serverfehler.' });
  }
});
